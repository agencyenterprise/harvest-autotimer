document.addEventListener("click", clickHandler);

function isEnabled() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("settings", (data) => {
      resolve(data.settings.enabled);
    });
  });
}

function getSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("settings", (data) => {
      if (
        !("settings" in data) ||
        !("harvest_token" in data.settings) ||
        !("harvest_account_id" in data.settings)
      ) {
        reject("Harvest keys missing. Set it on extension options.");
      }
      resolve(data.settings);
    });
  });
}

async function getDefaultHeaders() {
  const settings = await getSettings();
  return new Headers({
    Authorization: `Bearer ${settings.harvest_token}`,
    "Harvest-Account-ID": settings.harvest_account_id,
    "Content-Type": "application/json",
  });
}

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

function getDate() {
  function join(t, a, s) {
    function format(m) {
      const f = new Intl.DateTimeFormat("en", m);
      return f.format(t);
    }
    return a.map(format).join(s);
  }

  const formats = [
    { year: "numeric" },
    { month: "numeric" },
    { day: "numeric" },
  ];
  return join(new Date(), formats, "-");
}

async function startStory(info) {
  const enabled = await isEnabled();
  if (!enabled) return;
  const ids = await getHarvestProjectTaskIds();
  const newTimeEntryData = {
    ...ids,
    spent_date: getDate(),
    hours: 0,
    notes: info.title,
  };
  const data = await addTimeEntry(newTimeEntryData);
  addPTHarvestRelation(info.id, data.id);
}

async function finishStory(info) {
  const enabled = await isEnabled();
  if (!enabled) return;
  const harvestId = await getPTHarvestRelation(info.id);
  fetch(`https://api.harvestapp.com/api/v2/time_entries/${harvestId}/stop`, {
    method: "PATCH",
    headers: await getDefaultHeaders(),
  });
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

async function getHarvestProjectTaskIds() {
  const lastEntry = await getLastTimeEntry();
  if (lastEntry) {
    return {
      project_id: lastEntry.project.id,
      task_id: lastEntry.task.id,
    };
  } else {
    const pas = await getProjectAssignments();
    const project_id = pas?.[0].project.id;
    const task_id = pas?.[0].task_assignments?.[0].task.id;
    return { project_id, task_id };
  }
}

async function getLastTimeEntry() {
  const response = await fetch(
    "https://api.harvestapp.com/api/v2/time_entries",
    {
      headers: await getDefaultHeaders(),
    }
  );
  const data = await response.json();
  if (data.time_entries.length > 0) {
    return data.time_entries[0];
  }
  return false;
}

async function getProjectAssignments() {
  const res = await fetch(
    "https://api.harvestapp.com/v2/users/me/project_assignments",
    {
      headers: await getDefaultHeaders(),
    }
  );
  const d = await res.json();
  return d.project_assignments;
}

async function addTimeEntry(timeEntry) {
  const response = await fetch(
    "https://api.harvestapp.com/api/v2/time_entries",
    {
      method: "POST",
      body: JSON.stringify(timeEntry),
      headers: await getDefaultHeaders(),
    }
  );
  const data = await response.json();
  return data;
}
