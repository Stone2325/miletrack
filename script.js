let trips = JSON.parse(localStorage.getItem('miletrack_trips')) || [];
let businessName = localStorage.getItem('miletrack_businessName') || "Your Name / Company";
let isTracking = false;
let watchId = null;
let currentPositions = [];
let startTime = null;
let lastPosition = null;
let isLightMode = localStorage.getItem('lightMode') === 'true';

const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = x => x * Math.PI / 180;
    const R = 3958.8;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

function saveTrips() {
    localStorage.setItem('miletrack_trips', JSON.stringify(trips));
    renderHistory();
    updateTotalMiles();
}

function updateTotalMiles() {
    const total = trips.reduce((sum, t) => sum + (t.miles || 0), 0).toFixed(1);
    document.getElementById('totalMiles').textContent = total;
}

function renderHistory() {
    const container = document.getElementById('history');
    container.innerHTML = trips.length ? '' : '<p style="color:#64748b;text-align:center;">No trips yet</p>';
    
    trips.slice().reverse().forEach((trip, idx) => {
        const realIdx = trips.length - 1 - idx;
        const div = document.createElement('div');
        div.className = 'trip';
        div.innerHTML = `
            <strong>${trip.date}</strong> • ${trip.miles.toFixed(2)} miles<br>
            <small>${trip.startTime} – ${trip.endTime}</small><br>
            <em>${trip.purpose}</em>
            <button onclick="deleteTrip(${realIdx}); event.stopImmediatePropagation()" style="right:10px;">🗑</button>
            <button onclick="editTrip(${realIdx}); event.stopImmediatePropagation()" style="right:50px;">✏️</button>
        `;
        container.appendChild(div);
    });
}

function updateBusinessNameDisplay() {
    document.getElementById('businessNameDisplay').textContent = businessName;
}

function editBusinessName() {
    const newName = prompt("Enter your name or company name (shown on reports):", businessName);
    if (newName !== null && newName.trim() !== "") {
        businessName = newName.trim();
        localStorage.setItem('miletrack_businessName', businessName);
        updateBusinessNameDisplay();
    }
}

function toggleTheme() {
    isLightMode = !isLightMode;
    document.body.classList.toggle('light', isLightMode);
    localStorage.setItem('lightMode', isLightMode);
}

// ... (startTracking, stopTracking, deleteTrip, editTrip functions remain the same as previous version) ...

function stopTracking() {
    if (!isTracking) return;
    navigator.geolocation.clearWatch(watchId);
    
    let gpsMiles = 0;
    for (let i = 1; i < currentPositions.length; i++) {
        gpsMiles += haversine(currentPositions[i-1].lat, currentPositions[i-1].lon,
                             currentPositions[i].lat, currentPositions[i].lon);
    }

    const manualStart = prompt("Enter starting odometer reading (optional):");
    const manualEnd = manualStart ? prompt("Enter ending odometer reading:") : null;
    let finalMiles = gpsMiles;
    if (manualStart && manualEnd) {
        finalMiles = parseFloat(manualEnd) - parseFloat(manualStart);
        if (isNaN(finalMiles) || finalMiles < 0) finalMiles = gpsMiles;
    }

    const purpose = document.getElementById('purpose').value.trim() || 'No description';
    const endTime = new Date();

    const newTrip = {
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        endTime: endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        miles: finalMiles,
        purpose: purpose,
        gpsMiles: gpsMiles,
        manualOdometer: manualStart ? {start: manualStart, end: manualEnd} : null
    };

    trips.push(newTrip);
    localStorage.removeItem('miletrack_draft');
    saveTrips();

    isTracking = false;
    currentPositions = [];
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('currentTrip').style.display = 'none';
    document.getElementById('purpose').value = '';
    document.getElementById('status').textContent = 'Trip saved ✓';
    setTimeout(() => document.getElementById('status').textContent = 'Ready to track', 2500);
}

function showMonthlySummary() {
    const months = {};
    trips.forEach(t => {
        const monthKey = t.date.substring(0,7);
        if (!months[monthKey]) months[monthKey] = 0;
        months[monthKey] += t.miles || 0;
    });

    let html = `<p><strong>Logged by: ${businessName}</strong></p>`;
    html += `<p><strong>Year Total: ${document.getElementById('totalMiles').textContent} miles</strong></p><ul>`;
    Object.keys(months).sort().reverse().forEach(m => {
        html += `<li>${m}: ${months[m].toFixed(1)} miles</li>`;
    });
    html += '</ul>';
    document.getElementById('summaryContent').innerHTML = html;
    document.getElementById('modalTitle').textContent = `Monthly Summary - ${businessName}`;
    document.getElementById('modal').style.display = 'flex';
}

function exportCSV() {
    if (!trips.length) return alert('No trips yet!');
    let csv = 'Date,Start Time,End Time,Miles,Purpose,GPS Miles,Manual Odometer,Logged By\n';
    trips.forEach(t => {
        const manual = t.manualOdometer ? `${t.manualOdometer.start}-${t.manualOdometer.end}` : '';
        csv += `${t.date},${t.startTime},${t.endTime},${t.miles.toFixed(2)},${t.purpose.replace(/,/g,' ')},${(t.gpsMiles||0).toFixed(2)},${manual},${businessName.replace(/,/g,' ')}\n`;
    });
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MileTrack_${businessName.replace(/[^a-zA-Z0-9]/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
}

// Initialize everything
document.body.classList.toggle('light', isLightMode);
updateBusinessNameDisplay();
renderHistory();
updateTotalMiles();

// First-time prompt
if (!localStorage.getItem('miletrack_businessName')) {
    setTimeout(() => {
        editBusinessName();
    }, 800);
}

// Draft resume logic (same as before)
const draftTrip = JSON.parse(localStorage.getItem('miletrack_draft'));
if (draftTrip) {
    if (confirm("Resume previous unfinished trip?")) {
        alert("Press START to continue tracking.");
    }
}
