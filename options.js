const PROPS = {
  harvest_token: "text",
  harvest_account_id: "text",
  enabled: "checkbox",
};

async function saveSettings() {
  try {
    const name = await testHarvestKeys();
    chrome.storage.local.get("settings", (data) => {
      const settings = data.settings;
      Object.keys(PROPS).forEach((propKey) => {
        const propType = PROPS[propKey];
        if (propType === "checkbox") {
          settings[propKey] = document.getElementById(propKey).checked;
        } else if (propType === "text") {
          settings[propKey] = document.getElementById(propKey).value.trim();
        }
      });
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
    Object.keys(PROPS).forEach((propKey) => {
      const propType = PROPS[propKey];
      if (propType === "checkbox") {
        document.getElementById(propKey).checked = data?.settings?.[propKey];
      } else if (propType === "text") {
        document.getElementById(propKey).value =
          data?.settings?.[propKey] || "";
      }
    });
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
