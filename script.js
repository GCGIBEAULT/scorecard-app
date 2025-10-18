// scorecard-app/script.js
// Consolidated runtime: startRound, renderHole, stat locking, and auto-advance

let currentHole = 1;
const totalHoles = 18;
let selectedStats = [];
const roundData = {};
let playerHandicap = null;
let courseName = "";
let roundDate = "";
let courseLayout = {};
let inputCount = 0;

// Safe fallback for startRound if original not defined elsewhere
window.startRound = window.startRound || function () {
  // If your startRound logic exists inlined elsewhere, this placeholder won't override it.
  console.log("startRound() fallback invoked");
  // Minimal behavior: hide selector and render hole 1 if not already rendered
  document.getElementById("stat-selector")?.style.setProperty("display", "none");
  renderHole(1);
};

function renderHole(hole) {
  const container = document.getElementById("hole-view");
  if (!container) return console.error("hole-view not found");
  // Clear container for fresh render of a single hole
  container.innerHTML = "";

  const holeBlock = document.createElement("div");
  holeBlock.className = "hole-block";
  holeBlock.innerHTML = `<h2 id="hole${hole}">Hole ${hole}</h2>`;

  // Par layout grid fallback
  if (Object.keys(courseLayout).length < totalHoles) {
    const grid = document.createElement("div");
    grid.id = "par-entry-grid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(9, 1fr)";
    grid.style.gap = "6px";
    grid.style.padding = "8px 0";
    grid.style.width = "100%";

    for (let i = 1; i <= totalHoles; i++) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";

      const input = document.createElement("input");
      input.type = "number";
      input.min = 3;
      input.max = 5;
      input.className = "par-input";
      input.value = courseLayout[i] !== undefined ? courseLayout[i] : "";
      input.placeholder = `${i}`;
      input.style.width = "100%";
      input.style.boxSizing = "border-box";
      input.style.padding = "6px";
      input.style.fontSize = "0.9rem";
      input.style.border = "1px solid #ccc";
      input.style.borderRadius = "4px";

      input.onchange = () => {
        const val = parseInt(input.value, 10);
        if (val >= 3 && val <= 5) {
          courseLayout[i] = val;
          if (i === hole) {
            const parLabel = document.querySelector(".hole-label");
            if (parLabel) parLabel.textContent = `Par ${val}`;
          }
          if (Object.keys(courseLayout).length === totalHoles) {
            // done layout, clear grid and re-render hole 1
            grid.remove();
            container.innerHTML = "";
            renderHole(1);
          }
        }
      };

      wrapper.appendChild(input);
      grid.appendChild(wrapper);
    }

    holeBlock.appendChild(grid);
  }

  // Display Par if known
  if (hole === 1 || courseLayout[hole]) {
    const parDisplay = document.createElement("h2");
    parDisplay.className = "hole-label";
    parDisplay.style.marginTop = "0.5em";
    parDisplay.textContent = `Par ${courseLayout[hole] || "?"}`;
    holeBlock.appendChild(parDisplay);
  }

  // Inject stat buttons based on selectedStats
  selectedStats.forEach(stat => {
    const statBlock = document.createElement("div");
    statBlock.className = "stat-block";
    statBlock.innerHTML = `<strong>${stat}</strong><br>`;
    const options = getOptions(stat);
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt.label;
      btn.onclick = () => {
        recordStat(hole, stat, opt.value);
        // visually lock selected state
        lockInput(stat, opt.value);
      };
      statBlock.appendChild(btn);
    });
    holeBlock.appendChild(statBlock);
  });

  container.appendChild(holeBlock);
}

function getOptions(stat) {
  if (stat === "score") return [{ label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 }, { label: "5", value: 5 }, { label: "6", value: 6 }, { label: "7", value: 7 }, { label: "8", value: 8 }];
  if (stat === "putts") return [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }];
  if (stat === "gir") return [{ label: "Hit", value: true }, { label: "X", value: false }];
  if (stat === "fairway") return [{ label: "Hit", value: true }, { label: "X", value: false }];
  return [];
}

function recordStat(hole, stat, value) {
  if (!roundData[hole]) roundData[hole] = {};
  roundData[hole][stat] = value;
  advanceStatOrHole(stat);
  // persist minimal state
  try { localStorage.setItem("roundData", JSON.stringify(roundData)); } catch (e) {}
}

function advanceStatOrHole(lastStat) {
  const stats = selectedStats;
  const data = roundData[currentHole] || {};
  const entered = stats.filter(stat => data[stat] !== undefined);
  if (entered.length === stats.length) {
    // capture par if present in UI par input
    const parInput = document.getElementById(`par${currentHole}`);
    const parValue = parInput ? parseInt(parInput.value) : null;
    if (parValue) {
      courseLayout[currentHole] = parValue;
      try { localStorage.setItem(`layout_${courseName}`, JSON.stringify(courseLayout)); } catch (e) {}
    }
    try { localStorage.setItem("roundData", JSON.stringify(roundData)); } catch (e) {}
    currentHole++;
    if (currentHole === 10) {
      // show front9 summary optionally
      showSummary("front9");
      return;
    }
    if (currentHole <= totalHoles) {
      renderHole(currentHole);
    } else {
      showSummary("back9");
      showSummary("full");
    }
  }
}

// UI: lock input selection visually and auto advance after 4 inputs
function lockInput(category, value) {
  const blocks = document.querySelectorAll(`.${category}${currentHole}`);
  blocks.forEach(b => b.classList.remove("selected"));
  // create or find id for the clicked value
  const selectedId = `${category}${currentHole}-${String(value)}`;
  const selected = document.getElementById(selectedId);
  if (selected) {
    selected.classList.add("selected");
  }
  inputCount++;
  if (inputCount >= 4) {
    inputCount = 0;
    currentHole = Math.min(totalHoles, currentHole + 1);
    const next = document.getElementById(`hole${currentHole}`);
    if (next) next.scrollIntoView({ behavior: "smooth" });
  }
}

function showSummary(scope = "front9") {
  // Minimal summary implementation to avoid blocking the flow
  const summaryBlock = document.getElementById("summary-block");
  if (!summaryBlock) return;
  summaryBlock.innerHTML = `<div class="summary-block"><h2>${scope} Summary</h2><p>Saved.</p></div>`;
}

// Attach handlers that were previously inline
function attachStatHandlers() {
  ["score", "putts", "gir", "fairway"].forEach(category => {
    for (let hole = 1; hole <= totalHoles; hole++) {
      const nodes = document.querySelectorAll(`.${category}${hole}`);
      nodes.forEach(node => {
        const value = (node.textContent || "").trim();
        if (!node.id) node.id = `${category}${hole}-${value || "x"}`;
        node.removeEventListener("click", node._lockHandler || (() => {}));
        const handler = () => lockInput(category, value);
        node.addEventListener("click", handler);
        node._lockHandler = handler;
      });
    }
  });
  console.log("Stat handlers attached (runtime)");
}

// Attach Start Round button listener at runtime
function attachStartListener() {
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Start Round") || document.querySelector("button");
  if (!btn) return console.error("Start Round button not found");
  btn.removeEventListener("click", btn._srHandler || (() => {}));
  const handler = function () {
    console.log("Start Round clicked (runtime)");
    // read form controls and initialize state
    courseName = document.getElementById("courseName")?.value?.trim() || "";
    roundDate = document.getElementById("roundDate")?.value || "";
    playerHandicap = parseInt(document.getElementById("handicap")?.value || "0", 10) || null;
    selectedStats = Array.from(document.querySelectorAll("#stat-selector input:checked")).map(cb => cb.value);
    // hide selector and start
    document.getElementById("stat-selector")?.style.setProperty("display", "none");
    currentHole = 1;
    inputCount = 0;
    renderHole(currentHole);
    attachStatHandlers();
  };
  btn.addEventListener("click", handler);
  btn._srHandler = handler;
  console.log("Runtime listener attached to Start Round button");
}

// DOM-ready attach
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    attachStartListener();
    attachStatHandlers();
  });
} else {
  attachStartListener();
  attachStatHandlers();
}


