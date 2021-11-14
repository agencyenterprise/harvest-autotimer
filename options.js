const PROPS = ["harvest_token", "harvest_account_id"];

function saveSettings() {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings;
    PROPS.forEach(
      (prop) => (settings[prop] = document.getElementById(prop).value.trim())
    );
    chrome.storage.local.set({ settings });
  });
}

function fillSettings() {
  chrome.storage.local.get("settings", (data) => {
    PROPS.forEach(
      (prop) =>
        (document.getElementById(prop).value = data?.settings?.[prop] || "")
    );
  });
}

document
  .getElementById("harvest_help")
  .addEventListener("click", function (el) {
    const box = document.getElementById("harvest_help_box");
    if (box.style.display === "none") {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });

document.getElementById("save").addEventListener("click", saveSettings);
fillSettings();
