let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
let currentAudio = null;
let triggered = new Set();

function save() { localStorage.setItem('alarms', JSON.stringify(alarms)); renderAlarms(); }
function renderAlarms() {
  const list = document.getElementById('alarm-list');
  if (!list) return;
  if (alarms.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#888;margin-top:40px;">Aucune alarme</p>';
    return;
  }
  list.innerHTML = alarms.map((a, i) => `
    <div class="alarm-card">
      <div>
        <div class="time-display">${a.time}</div>
        <div style="color:#aaa;font-size:13px;">${a.mission !== 'none' ? 'Mission: ' + a.mission : ''}</div>
        <div class="day-dots">
          ${['D','L','M','M','J','V','S'].map((d, di) => `<div class="day-dot ${a.days.includes(di) ? 'active' : ''}">${d}</div>`).join('')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
        <input type="checkbox" ${a.enabled ? 'checked' : ''} onchange="toggle(${i})" style="transform:scale(1.5);">
        <button onclick="del(${i})" style="background:none;border:none;color:#ff4455;">✕</button>
      </div>
    </div>
  `).join('');
}
function toggle(i) { alarms[i].enabled = !alarms[i].enabled; save(); }
function del(i) { alarms.splice(i, 1); save(); }

// Unlock audio on first user interaction
document.body.addEventListener('click', unlockAudio, { once: true });
function unlockAudio() {
  const a = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
  a.volume = 0;
  a.play().then(() => a.pause()).catch(()=>{});
}

function checkAlarms() {
  const now = new Date();
  const hm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const day = now.getDay();
  const key = hm + '-' + day;
  alarms.forEach(a => {
    if (a.enabled && a.time === hm && a.days.includes(day) && !triggered.has(key)) {
      triggered.add(key);
      ringAlarm(a);
    }
  });
}

function ringAlarm(alarm) {
  if (currentAudio) currentAudio.pause();
  currentAudio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
  currentAudio.loop = true;
  currentAudio.volume = 1;
  currentAudio.play().catch(e => console.log('Audio blocked:', e));
  if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  startMission(alarm.mission || 'math');
}

function startMission(type) {
  const modal = document.getElementById('mission-modal');
  const content = document.getElementById('mission-content');
  if (!modal || !content) return;
  modal.classList.add('active');
  if (type === 'math') {
    const a = 20 + Math.floor(Math.random()*40);
    const b = 10 + Math.floor(Math.random()*30);
    const sum = a + b;
    content.innerHTML = `<h3 style="text-align:center;">Problème de math</h3><p style="font-size:36px;text-align:center;margin:30px 0;">${a} + ${b} =</p><input id="ans" type="number" style="width:100%;padding:16px;font-size:24px;text-align:center;background:#2a2a2a;color:white;border:none;border-radius:12px;" autofocus><button onclick="if(parseInt(document.getElementById('ans').value)===${sum}) finish() else alert('Incorrect, réessayez')" class="btn-primary">Valider</button>`;
  } else {
    content.innerHTML = `<h3 style="text-align:center;">Mission</h3><p style="text-align:center;margin:20px 0;">Complète la mission pour arrêter</p><button onclick="finish()" class="btn-primary">Terminer</button>`;
  }
}

function finish() {
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  const modal = document.getElementById('mission-modal');
  if (modal) modal.classList.remove('active');
  alert('Alarme arrêtée !');
}

// Check every 5 seconds
setInterval(checkAlarms, 5000);

// Event listeners (with null checks)
const fab = document.getElementById('add-alarm') || document.getElementById('fab');
if (fab) fab.onclick = () => document.getElementById('editor-modal').classList.add('active');
const closeEd = document.getElementById('close-editor');
if (closeEd) closeEd.onclick = () => document.getElementById('editor-modal').classList.remove('active');
document.querySelectorAll('.day-btn').forEach(btn => {
  btn.onclick = () => btn.classList.toggle('active');
});
const saveBtn = document.getElementById('save-alarm');
if (saveBtn) saveBtn.onclick = () => {
  const time = document.getElementById('alarm-time').value;
  const days = [...document.querySelectorAll('.day-btn.active')].map(b => +b.dataset.day);
  const mission = document.getElementById('mission-select').value;
  if (!time || days.length === 0) return alert('Choisis l\'heure et au moins un jour');
  alarms.push({ time, days, enabled: true, mission });
  save();
  document.getElementById('editor-modal').classList.remove('active');
};

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.onclick = () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + item.dataset.screen);
    if (screen) screen.classList.add('active');
  };
});

renderAlarms();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
