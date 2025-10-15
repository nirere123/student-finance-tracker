// ====== DOM ELEMENTS ======
const navBtns = document.querySelectorAll(".nav-btn");
const panels = document.querySelectorAll(".panel");

const form = document.getElementById("txnForm");
const desc = document.getElementById("desc");
const amt = document.getElementById("amt");
const cat = document.getElementById("cat");
const dt = document.getElementById("dt");
const txnId = document.getElementById("txnId");

const recordsList = document.getElementById("recordsList");
const empty = document.getElementById("empty");

const statCount = document.getElementById("stat-count");
const statSum = document.getElementById("stat-sum");
const statTop = document.getElementById("stat-top");
const statRemaining = document.getElementById("stat-remaining");

const capInput = document.getElementById("cap");
const capLive = document.getElementById("cap-live");

const searchInput = document.getElementById("searchInput");
const caseChk = document.getElementById("caseChk");
const sortSelect = document.getElementById("sortSelect");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

let records = JSON.parse(localStorage.getItem("unicash-records")) || [];
let settings = JSON.parse(localStorage.getItem("unicash-settings")) || {
  baseCurrency: "RWF",
  cap: 0,
};

// ====== NAVIGATION ======
navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.nav;
    panels.forEach((p) => p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    navBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ====== VALIDATION ======
function validateForm() {
  let valid = true;
  const err = (id, msg) => (document.getElementById(id).textContent = msg);

  err("err-desc", desc.value.trim() ? "" : "⚠ Description required");
  err("err-amt", amt.value > 0 ? "" : "⚠ Positive number required");
  err("err-cat", cat.value.trim() ? "" : "⚠ Category required");
  err("err-dt", dt.value ? "" : "⚠ Date required");

  if (!desc.value.trim() || amt.value <= 0 || !cat.value.trim() || !dt.value)
    valid = false;

  return valid;
}

// ====== SAVE TRANSACTION ======
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const data = {
    id: txnId.value || Date.now().toString(),
    desc: desc.value.trim(),
    amt: parseFloat(amt.value),
    cat: cat.value.trim(),
    dt: dt.value,
  };

  const existingIndex = records.findIndex((r) => r.id === data.id);
  if (existingIndex > -1) {
    records[existingIndex] = data;
  } else {
    records.push(data);
  }

  localStorage.setItem("unicash-records", JSON.stringify(records));
  form.reset();
  txnId.value = "";
  renderRecords();
  updateStats();
  alert(" Transaction saved!");
});

// ====== RENDER RECORDS ======
function renderRecords(list = records) {
  recordsList.innerHTML = "";
  if (!list.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.forEach((r) => {
    const div = document.createElement("div");
    div.className = "record";
    div.innerHTML = `
      <div>
        <strong>${r.desc}</strong><br>
        <small>${r.cat} • ${r.dt}</small>
      </div>
      <div>RWF ${r.amt.toFixed(2)}</div>
      <div class="actions">
        <button class="edit"></button>
        <button class="delete"></button>
      </div>
    `;
    div.querySelector(".edit").onclick = () => editRecord(r.id);
    div.querySelector(".delete").onclick = () => deleteRecord(r.id);
    recordsList.appendChild(div);
  });
}

// ====== EDIT / DELETE ======
function editRecord(id) {
  const r = records.find((r) => r.id === id);
  if (!r) return;
  txnId.value = r.id;
  desc.value = r.desc;
  amt.value = r.amt;
  cat.value = r.cat;
  dt.value = r.dt;
  document.querySelector('[data-nav="form"]').click();
}

function deleteRecord(id) {
  if (confirm(" Delete this transaction?")) {
    records = records.filter((r) => r.id !== id);
    localStorage.setItem("unicash-records", JSON.stringify(records));
    renderRecords();
    updateStats();
  }
}

// ====== SEARCH ======
searchInput.addEventListener("input", () => {
  const pattern = searchInput.value.trim();
  if (!pattern) return renderRecords();
  try {
    const regex = new RegExp(pattern, caseChk.checked ? "" : "i");
    const filtered = records.filter(
      (r) => regex.test(r.desc) || regex.test(r.cat)
    );
    renderRecords(filtered);
  } catch {
    renderRecords();
  }
});

// ====== SORT ======
sortSelect.addEventListener("change", () => {
  const value = sortSelect.value;
  records.sort((a, b) => {
    switch (value) {
      case "date_asc":
        return new Date(a.dt) - new Date(b.dt);
      case "date_desc":
        return new Date(b.dt) - new Date(a.dt);
      case "desc_az":
        return a.desc.localeCompare(b.desc);
      case "amount_asc":
        return a.amt - b.amt;
      case "amount_desc":
        return b.amt - a.amt;
      default:
        return 0;
    }
  });
  renderRecords();
});

// ====== DASHBOARD ======
function updateStats() {
  const total = records.length;
  const sum = records.reduce((s, r) => s + r.amt, 0);
  const cats = {};
  records.forEach((r) => (cats[r.cat] = (cats[r.cat] || 0) + r.amt));
  const topCat =
    Object.keys(cats).sort((a, b) => cats[b] - cats[a])[0] || "—";
  const remaining = settings.cap ? settings.cap - sum : 0;

  statCount.textContent = total;
  statSum.textContent = `RWF ${sum.toFixed(2)}`;
  statTop.textContent = topCat;
  statRemaining.textContent = `RWF ${remaining.toFixed(2)}`;
  capLive.textContent =
    remaining < 0
      ? "⚠ Over your monthly cap!"
      : `You have ${remaining.toFixed(2)} RWF left this month.`;
}

// ====== SETTINGS ======
document.getElementById("saveSettings").onclick = () => {
  settings = {
    baseCurrency: document.getElementById("baseCurrency").value,
    cap: parseFloat(capInput.value) || 0,
    rateUSD: document.getElementById("rateUSD").value,
    rateEUR: document.getElementById("rateEUR").value,
  };
  localStorage.setItem("unicash-settings", JSON.stringify(settings));
  updateStats();
  alert(" Settings saved!");
};

document.getElementById("resetSettings").onclick = () => {
  localStorage.removeItem("unicash-settings");
  settings = { baseCurrency: "RWF", cap: 0 };
  capInput.value = "";
  updateStats();
  alert("Settings reset.");
};


exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(records, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "unicash-data.json";
  a.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (Array.isArray(imported)) {
        records = imported;
        localStorage.setItem("unicash-records", JSON.stringify(records));
        renderRecords();
        updateStats();
        alert(" Data imported successfully!");
      }
    } catch {
      alert("⚠ Invalid JSON file.");
    }
  };
  reader.readAsText(file);
});

// ====== INIT ======
renderRecords();
updateStats();

// Show Dashboard by default
document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
document.getElementById("dashboard").classList.add("active");
document.querySelector('[data-nav="dashboard"]').classList.add("active");
