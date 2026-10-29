// Réveil Mission PWA
let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
let currentMission = null;

function saveAlarms() { localStorage.setItem('alarms', JSON.stringify(alarms)); renderAlarms(); }
function renderAlarms() {
  const list = document.getElementById('alarm-list');
  list.innerHTML = alarms.length === 0 ? '<div class="card" style="text-align:center;color:var(--secondary);">Aucune alarme</div>' : alarms.map((a, i) => `<div class="card alarm-item"><div><div class="time">${a.time}</div><div style="color:var(--secondary);font-size:13px;">${a.mission !== 'none' ? 'Mission: ' + a.mission : 'Sans mission'}</div><div class="days" style="margin-top:8px;">${['D','L','M','M','J','V','S'].map((d, di) => `<span class="day-btn ${a.days.includes(di) ? 'active' : ''}" style="width:28px;height:28px;font-size:12px;">${d}</span>`).join('')}</div></div><div><input type="checkbox" ${a.enabled ? 'checked' : ''} onchange="toggleAlarm(${i})" style="transform:scale(1.5);"><button onclick="deleteAlarm(${i})" style="background:none;border:none;color:#ff375f;margin-left:12px;">✕</button></div></div>`).join('');
}
function toggleAlarm(i) { alarms[i].enabled = !alarms[i].enabled; saveAlarms(); }
function deleteAlarm(i) { alarms.splice(i, 1); saveAlarms(); }

document.getElementById('add-alarm').onclick = () => {
  document.getElementById('editor-modal').classList.add('active');
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
};
document.getElementById('cancel-edit').onclick = () => document.getElementById('editor-modal').classList.remove('active');
document.getElementById('day-selector').onclick = e => { if (e.target.classList.contains('day-btn')) e.target.classList.toggle('active'); };
document.getElementById('save-alarm').onclick = () => {
  const time = document.getElementById('alarm-time').value;
  const mission = document.getElementById('mission-select').value;
  const days = Array.from(document.querySelectorAll('#day-selector .day-btn.active')).map(b => parseInt(b.dataset.day));
  alarms.push({ time, mission, days, enabled: true, id: Date.now() });
  saveAlarms();
  document.getElementById('editor-modal').classList.remove('active');
};

setInterval(checkAlarms, 10000);
function checkAlarms() {
  const now = new Date();
  const hhmm = now.toTimeString().slice(0,5);
  const day = now.getDay();
  alarms.forEach(a => { if (a.enabled && a.time === hhmm && a.days.includes(day)) triggerAlarm(a); });
}
function triggerAlarm(alarm) {
  const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
  audio.loop = true; audio.play().catch(() => {}); window.currentAudio = audio;
  if (alarm.mission === 'none') { if (confirm('Alarme ! Appuyez pour arrêter')) audio.pause(); }
  else startMission(alarm.mission);
}
function startMission(type) {
  currentMission = { type, roundsLeft: 3 };
  document.getElementById('mission-modal').classList.add('active');
  if (type === 'math') showMath(); else if (type === 'color') showColorTiles(); else showBarcode();
}
function showMath() {
  const a = Math.floor(Math.random()*50)+10, b = Math.floor(Math.random()*50)+10, c = Math.floor(Math.random()*30), answer = a+b+c;
  document.getElementById('mission-content').innerHTML = `<h3 style="text-align:center;">Problèmes de math</h3><div class="math-problem">${a} + ${b} + ${c} =</div><input type="number" id="math-answer" style="width:100%;padding:16px;font-size:24px;text-align:center;background:#2c2c2e;color:white;border:none;border-radius:12px;" placeholder="Réponse"><button class="btn-primary" style="margin-top:16px;" onclick="checkMath(${answer})">Valider</button><p style="text-align:center;color:var(--secondary);margin-top:10px;">Manches restantes: ${currentMission.roundsLeft}</p>`;
}
function checkMath(correct) {
  const user = parseInt(document.getElementById('math-answer').value);
  if (user === correct) { currentMission.roundsLeft--; if (currentMission.roundsLeft <= 0) dismissMission(); else showMath(); } else alert('Incorrect, réessayez !');
}
function showColorTiles() {
  const size = 6, targets = new Set(); while (targets.size < 5) targets.add(Math.floor(Math.random()*size*size));
  document.getElementById('mission-content').innerHTML = `<h3 style="text-align:center;">Trouver les tuiles de couleur</h3><p style="text-align:center;color:var(--secondary);">Touchez les tuiles jaunes</p><div class="grid" id="tile-grid"></div><button class="btn-primary" id="check-tiles" style="margin-top:16px;">Valider</button>`;
  const grid = document.getElementById('tile-grid');
  for (let i = 0; i < size*size; i++) { const tile = document.createElement('div'); tile.className = 'tile' + (targets.has(i) ? ' target' : ''); tile.onclick = () => tile.classList.toggle('selected'); grid.appendChild(tile); }
  document.getElementById('check-tiles').onclick = () => { const st = document.querySelectorAll('.tile.target.selected').length, sn = document.querySelectorAll('.tile.selected:not(.target)').length; if (st === targets.size && sn === 0) dismissMission(); else alert('Incorrect, essayez encore.'); };
}
function showBarcode() { document.getElementById('mission-content').innerHTML = `<h3 style="text-align:center;">Code-barre / QR-code</h3><p style="text-align:center;">Scannez un code de votre routine matinale<br>(Simulation : appuyez pour valider)</p><div style="height:150px;background:#2c2c2e;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:20px 0;">📷 Scanner simulé</div><button class="btn-primary" onclick="dismissMission()">Scanner (simulé)</button>`; }
function dismissMission() { if (window.currentAudio) window.currentAudio.pause(); document.getElementById('mission-modal').classList.remove('active'); alert('Alarme arrêtée ! Bon réveil 🌞'); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(console.error);
if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
renderAlarms();