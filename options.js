const PROPS = ["harvest_token", "harvest_account_id"];

async function saveSettings() {
  try {
    const name = await testHarvestKeys();

    chrome.storage.local.get("settings", (data) => {
      const settings = data.settings;
      PROPS.forEach(
        (prop) => (settings[prop] = document.getElementById(prop).value.trim())
      );
      chrome.storage.local.set({ settings }, () => {
        showMessage(`Keys for user ${name} saved!`);
      });
    });
  } catch (err) {
    showMessage(err, true);
  }
}

function fillSettings() {
  chrome.storage.local.get("settings", (data) => {
    PROPS.forEach(
      (prop) =>
        (document.getElementById(prop).value = data?.settings?.[prop] || "")
    );
  });
}

async function testHarvestKeys() {
  try {
    const token = document.getElementById("harvest_token").value.trim();
    const account_id = document
      .getElementById("harvest_account_id")
      .value.trim();
    const headers = new Headers({
      Authorization: `Bearer ${token}`,
      "Harvest-Account-ID": account_id,
      "Content-Type": "application/json",
    });

    const res = await fetch("https://api.harvestapp.com/v2/users/me", {
      headers,
    });
    const d = await res.json();
    return d.first_name;
  } catch (err) {
    throw "Invalid keys.";
  }
}

function showMessage(txt, error = false) {
  const messageBox = document.getElementById("message");
  messageBox.classList.remove("error");
  messageBox.classList.remove("success");
  messageBox.innerText = txt;
  messageBox.classList.add(error ? "error" : "success");
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
