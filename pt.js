document.addEventListener("click", clickHandler);

function clickHandler(event) {
  //button and dropdown selectors
  const selectors = {
    ".button.state": stateButtonClick,
    ".Dropdown__option.Dropdown__option--button": dropdownChange,
  };
  let el = event.target;
  do {
    for (const selector in selectors) {
      if (el.matches(selector)) {
        selectors[selector](el);
        return;
      }
    }
  } while ((el = el.parentNode) && el.matches);
}

function stateButtonClick(el) {
  const nextState = el.getAttribute("data-destination-state");
  const info = extractStoryInfo(el);
  if (nextState === "start") {
    startStory(info);
  } else if (nextState === "finish") {
    finishStory(info);
  }
}

function dropdownChange(el) {
  const nextState = el.getAttribute("data-aid");
  const info = extractStoryInfo(el);
  if (nextState === "Started") {
    startStory(info);
  } else if (nextState === "Finished") {
    finishStory(info);
  }
}

function extractStoryInfo(el) {
  const previewHeader = inPreviewStory(el);
  const form = inStory(el);
  let title = "";
  let id = "";
  if (previewHeader) {
    id = previewHeader.parentNode.getAttribute("data-id");
    title = previewHeader.querySelector(
      "[data-aid=StoryPreviewItem__title]"
    ).innerText;
  } else if (form) {
    id = form.querySelector('input[type="text"][readonly].id').value;
    title = form.querySelector('[data-aid="name"][name="story[name]"]').value;
  }
  id = id.replace(/^\D+/g, "");
  return { id, title };
}

const inPreviewStory = (el) => el.closest("header.preview");

const inStory = (el) => el.closest("form.story");

async function startStory(info) {
  const enabled = await isEnabled();
  if (!enabled) return;
  const data = await addTimeEntry(info.title);
  addPTHarvestRelation(info.id, data.id);
}

async function finishStory(info) {
  const enabled = await isEnabled();
  if (!enabled) return;
  const harvestId = await getPTHarvestRelation(info.id);
  await stopTimeEntry(harvestId);
}

function addPTHarvestRelation(ptId, harvestId) {
  chrome.storage.local.get(["ptHarvestMap"], (data) => {
    const map = data.ptHarvestMap || {};
    map[ptId] = harvestId;
    chrome.storage.local.set({ ptHarvestMap: map });
  });
}

function getPTHarvestRelation(ptId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["ptHarvestMap"], (data) => {
      resolve(data.ptHarvestMap[ptId]);
    });
  });
}
