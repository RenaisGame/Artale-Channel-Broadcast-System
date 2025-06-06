const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const maxLogsInput = document.getElementById("maxLogsInput");
const maxLogsDisplay = document.getElementById("max-logs-status");

let MAX_LOGS = 3000;
let keywordList = [];
const keywordInput = document.getElementById("keywordListInput");

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
    keywordInput.value = keywordList.join(", ");
  }
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

keywordInput.addEventListener("input", () => {
  keywordList = keywordInput.value.split(",").map(k => k.trim()).filter(Boolean);
  localStorage.setItem("highlight_keywords", keywordList.join(","));
});

loadSettings();
window.closeSettings = closeSettings;