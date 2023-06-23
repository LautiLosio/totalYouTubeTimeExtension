const apiKeyStatusContainerElement = document.getElementById("apiKeyStatusContainer");
const apiKeyStatusElement = document.getElementById("apiKeyStatus");
const submitApiKeyElement = document.getElementById("submitApiKey");
const apiKeyInput = document.getElementById("apiKey");
const totalDurationElement = document.getElementById("totalDuration");
const apiKeyFormElement = document.getElementById("apiKeyForm");
const videosCountElement = document.getElementById("videosCount");
const EFTtextElement = document.getElementById("EFTtext");
const titleTextElement = document.getElementById("titleText");
const groupTabsElement = document.getElementById("groupTabs");

let displayType = 'Total';
let totalDuration = 0;

apiKeyStatusContainerElement.addEventListener("click", () => {
  apiKeyFormElement.classList.toggle("show");
  apiKeyInput.focus();
  const downArrow = "\u25BE";
  const upArrow = "\u25B4";
  apiKeyStatusContainerElement.querySelector("i").innerHTML = apiKeyFormElement.classList.contains("show") ? upArrow : downArrow;

});

submitApiKeyElement.addEventListener("click", async () => {
  const apiKey = apiKeyInput.value;
  await saveApiKey(apiKey);
  apiKeyStatusElement.textContent = "🟢 API Key saved";
  apiKeyInput.value = ""; // Clear input
});

EFTtextElement.addEventListener("click", async () => {
  displayType = displayType === 'Total' ? 'EFT' : 'Total';
  chrome.storage.sync.set({ displayType });
  EFTtextElement.textContent = displayType === 'EFT' ? 'Total' : 'EFT';
  titleTextElement.textContent = displayType === 'EFT' ? 'You will finish at' : 'You will spend';
  displayText(displayType);
});

async function getApiKey() {
  const { key } = await chrome.storage.sync.get("key");
  return key;
}

async function saveApiKey(apiKey) {
  await chrome.storage.sync.set({ key: apiKey });
}

async function getVideoIds() {
  const tabs = await chrome.tabs.query({
    url: "https://www.youtube.com/watch*",
  });

  videosCountElement.textContent = `${tabs.length} ${tabs.length === 1 ? 'video' : 'videos'} found`

  return tabs.map((tab) => {
    const url = new URL(tab.url);
    return url.searchParams.get("v");
  });
}

async function getVideoLengths(apiKey, videoIds) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(",")}&key=${apiKey}`
    );
 
    const data = await response.json();

    if (data.items) {
      return data.items.map((item) => item.contentDetails.duration);
    } else {
      apiKeyStatusElement.textContent = "🔴 Bad API key.";
      throw new Error("Unable to fetch video lengths. Please check your API key.");
    }
  } catch (error) {
    // Handle the error appropriately, such as displaying an error message to the user.
    
    console.error(error);
    throw error;
  }
}

function calculateTotalLength(videoLengths) {
  return videoLengths.reduce((acc, curr) => {
    return acc + parseISO8601(curr);
  }, 0);
}

function parseISO8601(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const [_, hours, minutes, seconds] = match;
  const parsedHours = parseInt(hours) || 0;
  const parsedMinutes = parseInt(minutes) || 0;
  const parsedSeconds = parseInt(seconds) || 0;
  return parsedHours * 3600 + parsedMinutes * 60 + parsedSeconds;
}

function formatDuration(duration) {
  const date = new Date(duration * 1000);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// calculate EFT (estimated finish time). The local time plus the total length. this is the time the user will finish watching all the videos.

// get local system time
async function getLocalTime() {
  const time = new Date(); // this will create a new date object with the current time
  return time;
}


function addSeconds(currentDate, seconds) {
  const date = new Date(currentDate);
  date.setSeconds(date.getSeconds() + seconds);
  return date;
}

function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

async function getDisplayType() {
  const { displayType } = await chrome.storage.sync.get("displayType");
  EFTtextElement.textContent = displayType === 'EFT' ? 'Total' : 'EFT';
  titleTextElement.textContent = displayType === 'EFT' ? 'You will finish at' : 'You will spend';
  return displayType;
}

async function groupTabs() {
  const tabs = await chrome.tabs.query({
    url: "https://www.youtube.com/*",
  });
  const tabIds = tabs.map(tab => tab.id);
  
  chrome.tabGroups.query({ title: 'YouTube' }, (groups) => {
    if (groups.length > 0) {
      chrome.tabs.group({ tabIds, groupId: groups[0].id });
    } else {
      createGroup();
    }
  }
  );
}

async function createGroup() {
  chrome.tabs.query({
    url: "https://www.youtube.com/*",
  }, (tabs) => {
    const tabIds = tabs.map(tab => tab.id);
    chrome.tabs.group({ tabIds }, (groupId) => { chrome.tabGroups.update(groupId, { color: 'red', title: 'YouTube' }) });
  });
}

async function calculateTotalDuration() {
  groupTabs();
  const apiKey = await getApiKey();
  if (apiKey) {
    submitApiKeyElement.innerHTML = "Update API Key";
    apiKeyStatusElement.textContent = "🟢 API Key saved";
    const videoIds = await getVideoIds();
    if (apiKey && videoIds && videoIds.length > 0) {
      const videoDurations = await getVideoLengths(apiKey, videoIds);
      totalDuration = calculateTotalLength(videoDurations);
      displayType = await getDisplayType();
      displayText(displayType);
    }
  } else {
    apiKeyFormElement.classList.add("show");
  }
}

async function displayText(type) { 
  if (type === 'EFT') {
    const localTime = await getLocalTime();
    const localTimePlusTotalLength = addSeconds(localTime, totalDuration);
    const localTimeResult = formatTime(localTimePlusTotalLength);
    totalDurationElement.textContent = localTimeResult;
  } else if (type === 'Total') {
    const result = formatDuration(totalDuration);
    totalDurationElement.textContent = result;
  }
}


calculateTotalDuration();
