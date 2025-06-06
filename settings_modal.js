const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const maxLogsInput = document.getElementById("maxLogsInput");
const maxLogsDisplay = document.getElementById("max-logs-status");

let MAX_LOGS = 3000;
let keywordList = [];
const keywordContainer = document.getElementById("keywordInputs");

function loadSettings() {
  const stored = localStorage.getItem("max_logs");
  if (stored) {
    MAX_LOGS = parseInt(stored, 10);
    maxLogsInput.value = MAX_LOGS;
  }
  maxLogsDisplay.textContent = MAX_LOGS;

  const storedKeywords = localStorage.getItem("highlight_keywords");
  if (storedKeywords) {
    keywordList = storedKeywords.split(",").map(k => k.trim()).filter(Boolean);
  } else {
    keywordList = [];
  }
  renderKeywordInputs();
}

settingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "flex";
});

function closeSettings() {
  settingsModal.style.display = "none";
}

maxLogsInput.addEventListener("input", () => {
  const val = parseInt(maxLogsInput.value, 10);
  if (!isNaN(val) && val > 0) {
    MAX_LOGS = val;
    localStorage.setItem("max_logs", val);
    maxLogsDisplay.textContent = val;
  }
});


function renderKeywordInputs() {
  keywordContainer.innerHTML = "";
  keywordList.forEach((word, index) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.gap = "8px";
    
    const input = document.createElement("input");
    input.type = "text";
    input.value = word;
    input.style.flex = "1";
    input.style.padding = "6px";
    input.style.background = "#121212";
    input.style.border = "1px solid #555";
    input.style.color = "#eee";
    input.style.borderRadius = "4px";
    input.addEventListener("input", () => {
      keywordList[index] = input.value.trim();
      saveKeywords();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "tag-button";
    delBtn.textContent = "🗑️";
    delBtn.onclick = () => {
      keywordList.splice(index, 1);
      saveKeywords();
      renderKeywordInputs();
    };

    div.appendChild(input);
    div.appendChild(delBtn);
    keywordContainer.appendChild(div);
  });
}

function saveKeywords() {
  const cleaned = keywordList.map(k => k.trim()).filter(Boolean);
  console.log(cleaned)
  localStorage.setItem("highlight_keywords", cleaned.join(","));
  keywordList = cleaned;
}

function addKeywordInput() {
  keywordList.push("");
  renderKeywordInputs();
  saveKeywords();
}

loadSettings();
window.closeSettings = closeSettings;
window.addKeywordInput = addKeywordInput;