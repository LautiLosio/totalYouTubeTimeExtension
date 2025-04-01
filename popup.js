// Function to convert time string (MM:SS) to seconds
function timeToSeconds(timeStr) {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return minutes * 60 + seconds;
}

// Function to convert seconds to time string (HH:MM:SS)
function secondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to get time information from a YouTube tab
async function getTabTimeInfo(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Try to get video element
        const videoElement = document.querySelector('video');
        
        if (videoElement && !isNaN(videoElement.duration) && videoElement.duration > 0) {
          // Get duration and current time directly from video element
          const duration = Math.floor(videoElement.duration);
          const current = Math.floor(videoElement.currentTime);
          
          // Convert to MM:SS format
          const durationStr = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;
          const currentStr = `${Math.floor(current / 60)}:${(current % 60).toString().padStart(2, '0')}`;
          
          return {
            duration: durationStr,
            current: currentStr,
            isValid: true
          };
        }
        
        return {
          duration: '0:00',
          current: '0:00',
          isValid: false
        };
      }
    });
    
    return results[0].result;
  } catch (error) {
    console.error('Error getting time info:', error);
    return { duration: '0:00', current: '0:00', isValid: false };
  }
}

// Function to calculate Estimated Finish Time (EFT)
function calculateEFT(remainingTime) {
  const now = new Date();
  const finishTime = new Date(now.getTime() + remainingTime * 1000);
  return finishTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// Function to update time information
async function updateTimeInfo() {
  const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/watch*' });
  let totalDuration = 0;
  let totalWatched = 0;
  let validVideoCount = 0;
  let loadingCount = 0;

  for (const tab of tabs) {
    const timeInfo = await getTabTimeInfo(tab.id);
    if (timeInfo.isValid) {
      totalDuration += timeToSeconds(timeInfo.duration);
      totalWatched += timeToSeconds(timeInfo.current);
      validVideoCount++;
    } else {
      loadingCount++;
    }
  }

  const remainingTime = totalDuration - totalWatched;

  // Only update if we have at least one valid video
  if (validVideoCount > 0) {
    // Store the values for toggle functionality
    window.totalDurationValue = totalDuration;
    window.remainingTimeValue = remainingTime;

    // Update UI elements
    const timeDisplayElement = document.getElementById('timeDisplay');
    const timeToggleButton = document.getElementById('timeToggleButton');
    const titleText = document.getElementById('titleText');
    
    // Get the current display state
    const { showingEft = false } = await chrome.storage.local.get('showingEft');
    
    // Update based on current toggle state
    if (showingEft) {
      timeDisplayElement.textContent = calculateEFT(remainingTime);
      timeToggleButton.classList.add('showing-eft');
      timeToggleButton.textContent = 'Left';
      titleText.textContent = 'Finishing at';
    } else {
      timeDisplayElement.textContent = secondsToTime(remainingTime);
      timeToggleButton.classList.remove('showing-eft');
      timeToggleButton.textContent = 'Finish';
      titleText.textContent = 'Time remaining';
    }
    
    const statusText = loadingCount > 0 ? 
      `${validVideoCount} loaded + ${loadingCount} loading` :
      `${validVideoCount} ${validVideoCount === 1 ? 'video' : 'videos'} loaded`;
    
    document.getElementById('videoCount').textContent = statusText;
  } else {
    // No valid videos found
    const timeDisplayElement = document.getElementById('timeDisplay');
    const titleText = document.getElementById('titleText');
    
    timeDisplayElement.textContent = '--:--';
    titleText.textContent = 'Waiting for videos';
    document.getElementById('videoCount').textContent = 
      `${tabs.length} ${tabs.length === 1 ? 'video' : 'videos'} loading...`;
  }
}

// Function to toggle between remaining time and EFT
async function toggleDisplay() {
  const timeDisplayElement = document.getElementById('timeDisplay');
  const timeToggleButton = document.getElementById('timeToggleButton');
  const titleText = document.getElementById('titleText');
  
  // Get the current display state
  const { showingEft = false } = await chrome.storage.local.get('showingEft');
  
  if (showingEft) {
    timeDisplayElement.textContent = secondsToTime(window.remainingTimeValue);
    timeToggleButton.classList.remove('showing-eft');
    timeToggleButton.textContent = 'Finish';
    titleText.textContent = 'Time remaining';
    await chrome.storage.local.set({ showingEft: false });
  } else {
    timeDisplayElement.textContent = calculateEFT(window.remainingTimeValue);
    timeToggleButton.classList.add('showing-eft');
    timeToggleButton.textContent = 'Left';
    titleText.textContent = 'Finishing at';
    await chrome.storage.local.set({ showingEft: true });
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  updateTimeInfo();
  
  // Add click handler for time toggle button
  document.getElementById('timeToggleButton').addEventListener('click', toggleDisplay);
  
  // Update times every second
  setInterval(updateTimeInfo, 1000);
}); 