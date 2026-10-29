let alarms = JSON.parse(localStorage.getItem("alarms") || "[]");
let ringing = false;

function save() {
  localStorage.setItem("alarms", JSON.stringify(alarms));
  render();
}

function render() {
  const list = document.getElementById("alarm-list");
  if (!list) return;
  if (alarms.length === 0) {
    list.innerHTML = '<div class="empty">Aucune alarme</div>';
    return;
  }
  list.innerHTML = alarms.map((a, i) => `
    <div class="alarm-card">
      <div>
        <div class="time">${a.time}</div>
        <div class="days-small">
          ${["D","L","M","M","J","V","S"].map((d, di) => `<div class="day-small ${a.days.includes(di) ? "on" : ""}>${d}</div>`).join("")}
        </div>
      </div>
      <div class="switch ${a.enabled ? "on" : ""}" onclick="toggle(${i})"></div>
    </div>
  `).join("");
}

function toggle(i) {
  alarms[i].enabled = !alarms[i].enabled;
  save();
}

// Check every second for exact match
setInterval(() => {
  if (ringing) return;
  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const day = now.getDay();
  const match = alarms.find(a => a.enabled && a.time === hhmm && a.days.includes(day));
  if (match) {
    trigger(match);
  }
}, 1000);

function trigger(alarm) {
  ringing = true;
  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
  audio.loop = true;
  audio.play().catch(e => {
    console.log("Audio needs user interaction");
  });
  const a = 15 + Math.floor(Math.random() * 20);
  const b = 10 + Math.floor(Math.random() * 15);
  const ans = a + b;
  const userAns = prompt(`Alarme !\n${a} + ${b} = ?\n(Entrez la réponse pour arrêter)`);
  if (parseInt(userAns) === ans) {
    audio.pause();
    ringing = false;
    alert("Alarme arrêtée !");
  } else {
    // Keep ringing or re-prompt
    setTimeout(() => { ringing = false; }, 30000); // reset after 30s if not solved
  }
}

document.getElementById("add-alarm")?.addEventListener("click", () => {
  document.getElementById("editor-modal")?.classList.add("active");
});

document.querySelectorAll(".close-modal").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".modal").forEach(m => m.classList.remove("active"));
  });
});

document.querySelectorAll("#days button").forEach(btn => {
  btn.addEventListener("click", () => btn.classList.toggle("selected"));
});

document.getElementById("save-full")?.addEventListener("click", () => {
  const time = document.getElementById("time-input").value;
  const selected = Array.from(document.querySelectorAll("#days button.selected")).map(b => parseInt(b.dataset.d));
  if (time && selected.length) {
    alarms.push({ time, days: selected, enabled: true, id: Date.now() });
    save();
    document.getElementById("editor-modal").classList.remove("active");
  } else {
    alert("Choisis une heure et des jours");
  }
});

render();
