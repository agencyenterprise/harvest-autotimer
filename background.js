const enabledChanged = (changes) =>
  !changes.settings.oldValue ||
  changes.settings.newValue.enabled !== changes.settings.oldValue.enabled;

const harvestTokenSet = (changes) =>
  changes.settings.newValue.harvest_token.length > 0 &&
  (!changes.settings.oldValue ||
    changes.settings.oldValue.harvest_token.length === 0);

const harvestAccountIdSet = (changes) =>
  changes.settings.newValue.harvest_account_id.length > 0 &&
  (!changes.settings.oldValue ||
    changes.settings.oldValue?.harvest_account_id.length === 0);

const harvestCredentialsSet = (changes) =>
  harvestTokenSet(changes) && harvestAccountIdSet(changes);

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "local") {
    if (enabledChanged(changes)) {
      updateIcon();
    } else if (harvestCredentialsSet(changes)) {
      enableExtension();
    }
  }
});

chrome.runtime.onInstalled.addListener(function () {
  initSettings();
  openSettings();
  updateIcon();
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
  enabled: false,
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

async function openSettings() {
  try {
    await isHarvestSet();
  } catch (err) {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  }
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

function enableExtension() {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings;
    settings.enabled = true;
    chrome.storage.local.set({ settings });
  });
}

function toggleExtension() {
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings;
    settings.enabled = !settings.enabled;
    chrome.storage.local.set({ settings });
  });
}

function updateIcon() {
  chrome.storage.local.get("settings", (data) => {
    setIcon(data.settings.enabled);
  });
}

async function getIconImage(enabled) {
  const svg = new OffscreenCanvas(330, 330);
  const svgContext = svg.getContext("2d");
  svgContext.fillStyle = enabled ? "#FD7326FF" : "#FD732660";
  svgContext.fill(
    new Path2D(
      "M67.4914 31.8945C95.7794 11.1717 129.934 0 165 0V146.525H133.847V77H91.6264V252.135H133.847V190H164.94H196.034V252.135H238.014V138.711L320.244 109.103C332.123 142.096 333.182 178.015 323.268 211.651C313.353 245.286 292.981 274.889 265.106 296.163C237.231 317.438 203.302 329.279 168.243 329.968C133.183 330.657 98.8161 320.159 70.1263 299.996C41.4366 279.833 19.9165 251.055 8.68788 217.835C-2.54072 184.615 -2.89387 148.682 7.67966 115.248C18.2532 81.8134 39.2035 52.6173 67.4914 31.8945ZM238.014 138.711V77H196.034V146.525H165V165L238.014 138.711Z"
    ),
    "evenodd"
  );
  svgContext.fill(
    new Path2D(
      "M165 0C208.43 5.17893e-07 250.108 17.1225 280.995 47.6535C311.882 78.1844 329.486 119.662 329.989 163.088C330.492 206.515 313.854 248.389 283.683 279.627C253.511 310.866 212.241 328.949 168.823 329.956C125.405 330.962 83.341 314.81 51.7552 285.003C20.1694 255.195 1.60885 214.137 0.099656 170.734C-1.40954 127.33 14.2543 85.0822 43.6935 53.1531C73.1327 21.224 113.973 2.1891 157.356 0.177152L158.019 14.4779C118.4 16.3153 81.1035 33.6987 54.2186 62.8575C27.3337 92.0162 13.0289 130.599 14.4072 170.236C15.7854 209.874 32.7355 247.37 61.5808 274.591C90.4262 301.812 128.84 316.562 168.491 315.643C208.142 314.724 245.832 298.21 273.385 269.682C300.938 241.154 316.133 202.913 315.674 163.254C315.214 123.595 299.137 85.7169 270.931 57.835C242.724 29.9531 204.661 14.3162 165 14.3162L165 0Z"
    )
  );
  svgContext.fill(
    new Path2D(
      "M238.014 138.711L165 165L165 146.525H196.034V77H238.014V138.711Z"
    )
  );

  const size = 48;
  const offset = 4;
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, size, size);
  context.fillStyle = "transparent";
  context.fillRect(0, 0, size, size);

  context.arc(size / 2, size / 2, size / 2 - offset, 0, 2 * Math.PI);
  context.fillStyle = enabled ? "white" : "#80808060";
  context.fill();

  context.drawImage(
    svg,
    0,
    0,
    330,
    330,
    offset,
    offset,
    size - 2 * offset,
    size - 2 * offset
  );

  const imageData = context.getImageData(0, 0, size, size);
  return { imageData };
}

function setIcon(enabled) {
  getIconImage(enabled).then((icon) => chrome.action.setIcon(icon, () => {}));
}
