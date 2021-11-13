chrome.runtime.onInstalled.addListener(function (object) {
  chrome.tabs.create({url: chrome.runtime.getURL("options.html")});
});