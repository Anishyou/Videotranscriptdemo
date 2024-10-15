# Videotranscriptdemo

# Angular Video Player with Subtitles

This is an Angular video player application that uses the TUM Live video API to stream videos, display subtitles, and allow users to search through the subtitles 
and jump to specific points in the video. It uses **Hls.js** for adaptive video streaming and dynamically fetches and displays subtitles in real-time.

## Features

- Stream video using HLS (`.m3u8` format).
- Display WebVTT subtitles.
- Search through subtitles.
- Click on subtitles to jump to specific points in the video.
- Sync subtitles with the video player's current time.

## Prerequisites

Before running the project, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Angular CLI](https://angular.io/guide/setup-local) (`npm install -g @angular/cli`)

## How to Use

1. Clone the repository:
2. Find the Video URL with your personal jwt token (More on that below)
3. Run  npm install on terminal
4. npm serve ( to start the application)
5. Navigate to the respective localhost (generally http://localhost:4200)
   



Finding the Video URL
To obtain the video URL, follow these steps:

Go to the TUM Live stream link.

Play the video.

Right-click on the page and select Inspect.

Go to the Network tab.

You should see a network request with playlist.m3u8?jwt=... in the name(might have to refresh). Click on it and copy the full URL (including the jwt token).

Paste the full URL (with the jwt token) into the videoUrl property in video-player.component.ts:
