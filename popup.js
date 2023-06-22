const apiKeyStatusContainerElement = document.getElementById("apiKeyStatusContainer");
const apiKeyStatusElement = document.getElementById("apiKeyStatus");
const submitApiKeyElement = document.getElementById("submitApiKey");
const apiKeyInput = document.getElementById("apiKey");
const totalDurationElement = document.getElementById("totalDuration");
const apiKeyFormElement = document.getElementById("apiKeyForm");
const videosCountElement = document.getElementById("videosCount");

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

(async () => {
  const apiKey = await getApiKey();
  if (apiKey) {
    submitApiKeyElement.innerHTML = "Update API Key";
    apiKeyStatusElement.textContent = "🟢 API Key saved";
    const videoIds = await getVideoIds();
    if (apiKey && videoIds && videoIds.length > 0) {
      const videoLengths = await getVideoLengths(apiKey, videoIds);
      const totalLength = calculateTotalLength(videoLengths);
      const result = formatDuration(totalLength);
      totalDurationElement.textContent = result;
    }
  }
})();

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
