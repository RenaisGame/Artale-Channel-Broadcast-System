const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const maxLogsInput = document.getElementById("maxLogsInput");
const maxLogsDisplay = document.getElementById("max-logs-status");

let MAX_LOGS = 3000;

function loadSettings() {
  const stored = localStorage.getItem("max_logs");
  if (stored) {
    MAX_LOGS = parseInt(stored, 10);
    maxLogsInput.value = MAX_LOGS;
  }
  maxLogsDisplay.textContent = MAX_LOGS;
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

loadSettings();
window.closeSettings = closeSettings;