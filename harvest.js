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

async function addTimeEntry(title) {
  const ids = await getHarvestProjectTaskIds();
  const timeEntry = {
    ...ids,
    spent_date: getDate(),
    hours: 0,
    notes: title,
  };
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

async function stopTimeEntry(id) {
  const response = await fetch(
    `https://api.harvestapp.com/api/v2/time_entries/${id}/stop`,
    {
      method: "PATCH",
      headers: await getDefaultHeaders(),
    }
  );
  const data = await response.json();
  return data;
}
