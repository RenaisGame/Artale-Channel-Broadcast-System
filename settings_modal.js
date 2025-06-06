const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const maxLogsInput = document.getElementById("maxLogsInput");
const maxLogsDisplay = document.getElementById("max-logs-status");
const highlightWordsDisplay = document.getElementById("highlighted-words");

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
    try {
      const parsed = JSON.parse(storedKeywords);
      keywordList = Array.isArray(parsed)
        ? parsed.map(k => ({
            text: typeof k === "string" ? k : k.text,
            notify: typeof k === "object" && k.notify === true,
            mode: (k.mode === "收" || k.mode === "賣") ? k.mode : "任意"
          }))
        : [];
    } catch {
      keywordList = [];
    }
  }
  renderKeywordInputs();
}

settingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "flex";
  const needsNotification = keywordList.some(k => k.notify === true);
  if (needsNotification && Notification.permission === "default") {
    Notification.requestPermission();
  }
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
  keywordList.forEach((item, index) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.gap = "8px";
    div.style.alignItems = "center";

    const input = document.createElement("input");
    input.type = "text";
    input.value = item.text || "";
    input.style.flex = "1";
    input.style.padding = "6px";
    input.style.background = "#121212";
    input.style.border = "1px solid #555";
    input.style.color = "#eee";
    input.style.borderRadius = "4px";
    input.addEventListener("input", () => {
      keywordList[index].text = input.value.trim();
      saveKeywords();
    });

    const bellBtn = document.createElement("button");
    bellBtn.className = "tag-button";
    bellBtn.innerHTML = item.notify ? "🔔" : "🔕";
    bellBtn.style.color = item.notify ? "#ffd700" : "#888";
    bellBtn.title = item.notify ? "點擊取消通知" : "點擊啟用通知";
    bellBtn.addEventListener("click", () => {
      keywordList[index].notify = !keywordList[index].notify;
      saveKeywords();
      renderKeywordInputs();
    });

    const select = document.createElement("select");
    ["任意", "收", "賣"].forEach(opt => {
      const option = document.createElement("option");
      option.value = opt;
      option.textContent = opt;
      if (keywordList[index].mode === opt) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", () => {
      keywordList[index].mode = select.value;
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

    div.appendChild(select);
    div.appendChild(input);
    div.appendChild(bellBtn);
    div.appendChild(delBtn);
    keywordContainer.appendChild(div);
  });
}

function saveKeywords() {
  const cleaned = keywordList.map(k => ({...k, text: k.text.trim()})).filter(k => Boolean(k.text));
  localStorage.setItem("highlight_keywords", JSON.stringify(cleaned));
  updateHighlightDisplay();
}

function addKeywordInput() {
  keywordList.push({ text: "", notify: false, mode: "任意" });
  renderKeywordInputs();
  saveKeywords();
}

function updateHighlightDisplay() {
  const words = keywordList
    .map(k => {
      const icon = k.notify ? "🔔" : "🔕";
      const mode = k.mode || "任意";
      return `[${mode}] ${k.text.trim()} ${icon}`;
    });
  highlightWordsDisplay.textContent = words.join(",  ") || "無";
}

loadSettings();
updateHighlightDisplay();
window.closeSettings = closeSettings;
window.addKeywordInput = addKeywordInput;