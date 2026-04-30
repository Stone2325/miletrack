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
    const R = 3958.8; // miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    const newName = prompt("Enter your name or company name:", businessName);
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

function startTracking() {
    if (isTracking) return;

    const statusEl = document.getElementById('status');
    
    navigator.geolocation.getCurrentPosition(pos => {
        isTracking = true;
        startTime = new Date();
        currentPositions = [{lat: pos.coords.latitude, lon: pos.coords.longitude}];
        lastPosition = currentPositions[0];

        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('stopBtn').style.display = 'block';
        document.getElementById('currentTrip').style.display = 'block';
        
        statusEl.textContent = '🟢 TRACKING LIVE • GPS Active';
        statusEl.style.background = '#22c55e';

        // Auto-save draft every 30s
        setInterval(() => {
            if (isTracking) {
                localStorage.setItem('miletrack_draft', JSON.stringify({
                    startTime: startTime.toISOString(),
                    positions: currentPositions,
                    purpose: document.getElementById('purpose').value
                }));
            }
        }, 30000);

        watchId = navigator.geolocation.watchPosition(newPos => {
            const newPoint = {lat: newPos.coords.latitude, lon: newPos.coords.longitude};
            currentPositions.push(newPoint);
            lastPosition = newPoint;

            let totalLive = 0;
            for (let i = 1; i < currentPositions.length; i++) {
                totalLive += haversine(
                    currentPositions[i-1].lat, currentPositions[i-1].lon,
                    currentPositions[i].lat, currentPositions[i].lon
                );
            }
            document.getElementById('liveMiles').textContent = totalLive.toFixed(2);
        }, (err) => {
            console.error(err);
            alert("GPS error: " + err.message);
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
    }, (err) => {
        console.error(err);
        alert("Location access denied or unavailable.\n\nPlease tap the lock icon in Chrome address bar → allow Location.");
    });
}

function stopTracking() {
    if (!isTracking) return;
    navigator.geolocation.clearWatch(watchId);

    let gpsMiles = 0;
    for (let i = 1; i < currentPositions.length; i++) {
        gpsMiles += haversine(
            currentPositions[i-1].lat, currentPositions[i-1].lon,
            currentPositions[i].lat, currentPositions[i].lon
        );
    }

    const manualStart = prompt("Starting odometer (optional, leave blank for GPS):");
    let finalMiles = gpsMiles;
    if (manualStart) {
        const manualEnd = prompt("Ending odometer reading:");
        if (manualEnd) {
            finalMiles = parseFloat(manualEnd) - parseFloat(manualStart);
            if (isNaN(finalMiles) || finalMiles < 0) finalMiles = gpsMiles;
        }
    }

    const purpose = document.getElementById('purpose').value.trim() || 'No description entered';
    const endTime = new Date();

    const newTrip = {
        date: startTime.toISOString().split('T')[0],
        startTime: startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        endTime: endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
        miles: finalMiles,
        purpose: purpose,
        gpsMiles: gpsMiles,
        manualOdometer: manualStart ? {start: manualStart, end: manualEnd || ''} : null
    };

    trips.push(newTrip);
    localStorage.removeItem('miletrack_draft');
    saveTrips();

    // Reset UI
    isTracking = false;
    currentPositions = [];
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('stopBtn').style.display = 'none';
    document.getElementById('currentTrip').style.display = 'none';
    document.getElementById('purpose').value = '';
    document.getElementById('status').textContent = '✅ Trip saved!';
    document.getElementById('status').style.background = '#334155';
    setTimeout(() => document.getElementById('status').textContent = 'Ready to track', 3000);
}

function deleteTrip(index) {
    if (confirm('Delete this trip?')) {
        trips.splice(index, 1);
        saveTrips();
    }
}

function editTrip(index) {
    const trip = trips[index];
    const newPurpose = prompt("Edit purpose:", trip.purpose);
    if (newPurpose !== null) {
        trip.purpose = newPurpose;
        const newMilesStr = prompt("Edit miles:", trip.miles);
        const newMiles = parseFloat(newMilesStr);
        if (!isNaN(newMiles)) trip.miles = newMiles;
        saveTrips();
    }
}

function showMonthlySummary() {
    const months = {};
    trips.forEach(t => {
        const key = t.date.substring(0,7);
        months[key] = (months[key] || 0) + (t.miles || 0);
    });

    let html = `<p><strong>Logged by: ${businessName}</strong></p>`;
    html += `<p><strong>Total Miles: ${document.getElementById('totalMiles').textContent}</strong></p><ul>`;
    Object.keys(months).sort().reverse().forEach(m => {
        html += `<li>${m}: ${months[m].toFixed(1)} miles</li>`;
    });
    html += '</ul>';

    document.getElementById('summaryContent').innerHTML = html;
    document.getElementById('modalTitle').textContent = `Monthly Summary`;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
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

// ==================== INITIALIZE ====================
document.body.classList.toggle('light', isLightMode);
updateBusinessNameDisplay();
renderHistory();
updateTotalMiles();

// First time setup
if (!localStorage.getItem('miletrack_businessName')) {
    setTimeout(editBusinessName, 1000);
}

// Resume draft if any
if (localStorage.getItem('miletrack_draft')) {
    if (confirm("Resume unfinished trip from last time?")) {
        alert("Press the big START button to continue.");
    }
}
