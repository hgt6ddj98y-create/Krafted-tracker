const PROGRAM = {
  weeks: {
    1:{ bench:"85", ohp:"50" },
    2:{ bench:"87.5", ohp:"52.5" },
    3:{ bench:"90", ohp:"55" },
    4:{ bench:"92.5", ohp:"57.5" },
    5:{ bench:"95", ohp:"60" },
    6:{ bench:"97.5", ohp:"62.5" },
    7:{ bench:"100", ohp:"65" },
    8:{ bench:"102.5", ohp:"67.5" },
    9:{ bench:"105", ohp:"70" },
    10:{ bench:"107.5", ohp:"70" },
    11:{ bench:"110", ohp:"70" },
    12:{ bench:"75", ohp:"45" }
  },
  days: {
    1: [
      { name:"Bench Press", defaultTargetFromWeek:"bench" },
      { name:"Incline DB Press", defaultTarget:"40" },
      { name:"Chest Press Machine", defaultTarget:"" },
      { name:"Cable Fly (Low–High)", defaultTarget:"" },
      { name:"Weighted Dips", defaultTarget:"" }
    ],
    2: [
      { name:"Weighted Pull-Ups", defaultTarget:"" },
      { name:"Barbell Row", defaultTarget:"" },
      { name:"Chest-Supported Row", defaultTarget:"" },
      { name:"Lat Pulldown", defaultTarget:"" },
      { name:"Seated Cable Row", defaultTarget:"" }
    ],
    3: [
      { name:"Leg Press", defaultTarget:"" },
      { name:"Hack / Goblet Squat", defaultTarget:"" },
      { name:"Bulgarian Split Squat", defaultTarget:"" },
      { name:"Leg Curl", defaultTarget:"" },
      { name:"Leg Extension", defaultTarget:"" },
      { name:"Standing Calf Raise", defaultTarget:"" }
    ],
    4: [
      { name:"Standing OHP", defaultTargetFromWeek:"ohp" },
      { name:"Seated DB Press", defaultTarget:"35" },
      { name:"Lateral Raise", defaultTarget:"" },
      { name:"Rear Delt Fly", defaultTarget:"" },
      { name:"Upright Row (Wide)", defaultTarget:"" }
    ],
    5: [
      { name:"Barbell Curl", defaultTarget:"" },
      { name:"Incline DB Curl", defaultTarget:"" },
      { name:"Hammer Curl", defaultTarget:"" },
      { name:"EZ Skull Crusher", defaultTarget:"" },
      { name:"Rope Pushdown", defaultTarget:"" },
      { name:"Overhead Cable Ext", defaultTarget:"" }
    ]
  }
};

const $ = (id) => document.getElementById(id);

const state = {
  week: Number(localStorage.getItem("kc_week") || "1"),
  logs: JSON.parse(localStorage.getItem("kc_logs") || "[]")
};

function saveState(){
  localStorage.setItem("kc_week", String(state.week));
  localStorage.setItem("kc_logs", JSON.stringify(state.logs));
}

function setWeekUI(){
  $("week").value = state.week;
  const w = PROGRAM.weeks[state.week];
  $("benchTarget").textContent = w ? `${w.bench} kg` : "—";
  $("ohpTarget").textContent   = w ? `${w.ohp} kg` : "—";
  refreshExercises();
}

function refreshExercises(){
  const day = Number($("day").value);
  const exSel = $("exercise");
  exSel.innerHTML = "";
  PROGRAM.days[day].forEach((e, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = e.name;
    exSel.appendChild(opt);
  });
  setDefaultTarget();
}

function setDefaultTarget(){
  const day = Number($("day").value);
  const idx = Number($("exercise").value);
  const ex = PROGRAM.days[day][idx];
  const w = PROGRAM.weeks[state.week];

  let t = "";
  if (ex.defaultTargetFromWeek && w) t = w[ex.defaultTargetFromWeek] || "";
  else if (ex.defaultTarget) t = ex.defaultTarget;

  $("targetLoad").value = t;
}

function addLog(){
  const day = Number($("day").value);
  const idx = Number($("exercise").value);
  const ex = PROGRAM.days[day][idx];

  const entry = {
    ts: new Date().toISOString(),
    week: state.week,
    day,
    exercise: ex.name,
    targetLoad: $("targetLoad").value ? Number($("targetLoad").value) : null,
    actualLoad: $("actualLoad").value ? Number($("actualLoad").value) : null,
    reps: $("reps").value ? Number($("reps").value) : null,
    rpe: $("rpe").value ? Number($("rpe").value) : null,
    notes: $("notes").value || ""
  };

  state.logs.unshift(entry);
  saveState();
  renderTables();
  clearForm();
}

function clearForm(){
  $("actualLoad").value = "";
  $("reps").value = "";
  $("rpe").value = "";
  $("notes").value = "";
  // keep target load
}

function tableHTML(rows){
  if (!rows.length) return `<div class="small">No entries yet.</div>`;
  const head = `
    <table>
      <thead><tr>
        <th>Date</th><th>Week</th><th>Day</th><th>Exercise</th>
        <th>Target</th><th>Actual</th><th>Reps</th><th>RPE</th><th>Notes</th>
      </tr></thead><tbody>`;
  const body = rows.map(r => {
    const d = new Date(r.ts);
    const date = d.toLocaleDateString();
    return `<tr>
      <td>${date}</td>
      <td>${r.week}</td>
      <td>${r.day}</td>
      <td>${r.exercise}</td>
      <td>${r.targetLoad ?? ""}</td>
      <td>${r.actualLoad ?? ""}</td>
      <td>${r.reps ?? ""}</td>
      <td>${r.rpe ?? ""}</td>
      <td>${escapeHtml(r.notes)}</td>
    </tr>`;
  }).join("");
  return head + body + `</tbody></table>`;
}

function escapeHtml(str){
  return (str||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function renderTables(){
  const benchRows = state.logs.filter(x => x.exercise === "Bench Press");
  const ohpRows   = state.logs.filter(x => x.exercise === "Standing OHP");

  $("benchTable").innerHTML = tableHTML(benchRows);
  $("ohpTable").innerHTML = tableHTML(ohpRows);
  $("allTable").innerHTML = tableHTML(state.logs);
}

function exportData(){
  const blob = new Blob([JSON.stringify({ week: state.week, logs: state.logs }, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "krafted_coaching_tracker_export.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const obj = JSON.parse(reader.result);
      if (obj.week) state.week = Number(obj.week);
      if (Array.isArray(obj.logs)) state.logs = obj.logs;
      saveState();
      setWeekUI();
      renderTables();
      alert("Import successful.");
    }catch(e){
      alert("Import failed. Make sure it's a valid export JSON.");
    }
  };
  reader.readAsText(file);
}

function initTabs(){
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      ["bench","ohp","all"].forEach(t => {
        document.getElementById(`panel-${t}`).classList.toggle("hidden", t !== tab);
      });
    });
  });
}

$("day").addEventListener("change", refreshExercises);
$("exercise").addEventListener("change", setDefaultTarget);

$("saveWeek").addEventListener("click", () => {
  const w = Number($("week").value);
  state.week = Math.min(12, Math.max(1, w));
  saveState();
  setWeekUI();
  alert(`Week set to ${state.week}.`);
});

$("saveLog").addEventListener("click", addLog);
$("clearForm").addEventListener("click", clearForm);

$("export").addEventListener("click", exportData);
$("import").addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) importData(e.target.files[0]);
});

setWeekUI();
renderTables();
initTabs();
