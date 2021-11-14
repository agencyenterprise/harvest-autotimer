chrome.runtime.onInstalled.addListener(function (object) {
  initSettings();
  chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
});

chrome.action.onClicked.addListener(async function (tab) {
  try {
    await isHarvestSet();
    toggleExtension();
  } catch (err) {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  }
});

const defaultSettings = {
  enabled: true,
  harvest_account_id: "",
  harvest_token: "",
};

function initSettings() {
  chrome.storage.local.get("settings", (data) => {
    const settings = {
      ...defaultSettings,
      ...data?.settings,
    };
    chrome.storage.local.set({ settings });
  });
}

function isHarvestSet() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("settings", (data) => {
      if (
        !("settings" in data) ||
        !("harvest_token" in data.settings) ||
        !("harvest_account_id" in data.settings) ||
        data.settings.harvest_token.length === 0 ||
        data.settings.harvest_account_id.length === 0
      ) {
        reject("Harvest keys missing. Set it on extension options.");
      }
      resolve(data.settings);
    });
  });
}

function toggleExtension() {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings;
    settings.enabled = !settings.enabled;
    chrome.storage.local.set({ settings });
  });
}
