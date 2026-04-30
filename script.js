* { margin:0; padding:0; box-sizing:border-box; }
body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    padding: 16px;
    max-width: 600px;
    margin: 0 auto;
    transition: background 0.3s;
}
body.light {
    background: #f8fafc;
    color: #1e2937;
}
.container { background: #1e2937; border-radius: 20px; padding: 20px; transition: background 0.3s; }
body.light .container { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }

header { text-align: center; margin-bottom: 20px; position: relative; cursor: pointer; }
#businessNameDisplay { font-size: 1.1rem; color: #94a3b8; margin-top: 4px; }
body.light #businessNameDisplay { color: #475569; }

.status { text-align:center; padding:12px; background:#334155; border-radius:12px; margin-bottom:16px; font-weight:600; }
body.light .status { background:#e2e8f0; color:#1e2937; }

.totals { background:#1e40af; color:white; padding:16px; border-radius:12px; text-align:center; margin-bottom:24px; }
.summary-btn { margin-top:8px; padding:8px 16px; background:rgba(255,255,255,0.2); border:none; border-radius:8px; color:white; }

.buttons { display:flex; flex-direction:column; gap:16px; margin-bottom:24px; }

.big-btn {
    padding: 48px 20px;          /* Much taller for easy tap while driving */
    font-size: 1.8rem;           /* Big text */
    font-weight: 900;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    width: 100%;
    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    transition: all 0.2s;
}

.start {
    background: #22c55e;
    color: #0f172a;
    animation: pulse 2s infinite;   /* Gentle pulse so you see it immediately */
}
.stop {
    background: #ef4444;
    color: white;
    padding: 36px 20px;
    font-size: 1.6rem;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
}

#currentTrip { background:#334155; padding:16px; border-radius:12px; margin-bottom:24px; }
body.light #currentTrip { background:#f1f5f9; color:#1e2937; }
label { display:block; margin:12px 0 6px; font-weight:600; }
input { width:100%; padding:14px; border-radius:8px; border:none; font-size:1.1rem; }

.trip { background:#334155; padding:14px; border-radius:12px; margin-bottom:12px; position:relative; }
body.light .trip { background:#f1f5f9; }
.trip button { position:absolute; right:10px; top:10px; padding:4px 8px; font-size:0.8rem; }

.export-btn, .theme-btn {
    padding:18px; background:#1e40af; color:white; border:none; border-radius:12px;
    font-size:1.1rem; font-weight:bold; cursor:pointer;
}
.theme-btn { position:absolute; top:16px; right:16px; padding:8px 12px; font-size:1.4rem; }

.modal {
    position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8);
    display:flex; align-items:center; justify-content:center; z-index:100;
}
.modal-content {
    background:#1e2937; padding:24px; border-radius:20px; max-width:90%; width:500px; max-height:80vh; overflow:auto;
}
body.light .modal-content { background:white; color:#1e2937; }
