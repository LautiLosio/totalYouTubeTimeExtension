# YouTube Time Calculator

This extension helps you keep track of your YouTube watch time across multiple tabs. It automatically detects open YouTube videos and calculates the total time required to watch them all.

![image](https://github.com/LautiLosio/totalYouTubeTimeExtension/assets/38726997/f749360e-c13c-4560-8dce-decbfc2cade7)

## Features

- [x] Automatically detects open tabs with YouTube videos
- [x] Shows total remaining watch time for all videos
- [x] Displays estimated finish time (when you'll finish watching all videos)
- [x] Toggle between remaining time and finish time views
- [x] Real-time updates as you watch videos
- [x] Shows loading status for videos that are still buffering
- [x] Modern dark theme interface
- [x] Automatically groups YouTube tabs for better organization

## Installation

To use this extension, follow these steps:

1. Download or clone this repository to your local machine
2. Open Google Chrome and go to the extensions page (chrome://extensions/)
3. Enable the developer mode
4. Click on "Load Unpacked" and select the downloaded folder `totalYouTubeTimeExtension`
5. The extension will be installed
6. Paste your YouTube Data API Key in the extension's input field
7. Done!

## How to get your YouTube Data API Key

For detailed instructions on how to obtain the YouTube Data API, please refer to the [YouTube Data API Tutorial](getYoutubeAPI.md).

## Usage

Once the extension is installed and you've saved your API Key:

1. Open the YouTube videos you want to watch in separate tabs
2. The extension will automatically detect the videos and calculate the total watch time
3. Click the toggle button to switch between:
   - Remaining time: Shows how much time is left to watch all videos
   - Finish time: Shows when you'll finish watching all videos
4. The time updates in real-time as you watch the videos
5. The extension shows how many videos are loaded and if any are still loading

The extension works in the background, so you don't need to keep the popup open for it to track your videos.
