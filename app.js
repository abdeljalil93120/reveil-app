let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');
let currentAudio = null;

function save() { localStorage.setItem('alarms', JSON.stringify(alarms)); renderAlarms(); }
function renderAlarms() {
  const list = document.getElementById('alarm-list');
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

document.getElementById('fab').onclick = () => document.getElementById('editor-modal').classList.add('active');
document.getElementById('close-editor').onclick = () => document.getElementById('editor-modal').classList.remove('active');
document.querySelectorAll('.day-btn').forEach(btn => {
  btn.onclick = () => btn.classList.toggle('active');
});
document.getElementById('save-alarm').onclick = () => {
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

// Mission logic (simplified but interactive)
function startMission(type) {
  document.getElementById('mission-modal').classList.add('active');
  const content = document.getElementById('mission-content');
  if (type === 'math') {
    const a = 25 + Math.floor(Math.random()*30), b = 15 + Math.floor(Math.random()*25), sum = a + b;
    content.innerHTML = `<h3 style="text-align:center;">Math</h3><p style="font-size:32px;text-align:center;margin:20px 0;">${a} + ${b} =</p><input id="ans" type="number" style="width:100%;padding:14px;font-size:20px;text-align:center;background:#2a2a2a;color:white;border:none;border-radius:10px;"><button onclick="if(parseInt(document.getElementById('ans').value)===${sum}) finish() else alert('Incorrect')" class="save-btn">OK</button>`;
  } else {
    content.innerHTML = `<h3 style="text-align:center;">Mission</h3><p style="text-align:center;">Complète la mission pour arrêter</p><button onclick="finish()" class="save-btn">Terminé</button>`;
  }
}
function finish() {
  if (currentAudio) currentAudio.pause();
  document.getElementById('mission-modal').classList.remove('active');
  alert('Alarme arrêtée !');
}

setInterval(() => {
  const now = new Date();
  const hm = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  const day = now.getDay();
  alarms.forEach(a => {
    if (a.enabled && a.time === hm && a.days.includes(day)) {
      currentAudio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
      currentAudio.loop = true;
      currentAudio.play().catch(()=>{});
      startMission(a.mission || 'math');
    }
  });
}, 15000);

renderAlarms();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
