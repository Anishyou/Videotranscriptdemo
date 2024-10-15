import {Component, OnInit, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import {CommonModule} from '@angular/common';  // Import CommonModule for ngFor and ngIf
import {FormsModule} from '@angular/forms';  // Import FormsModule for ngModel
import {HttpClient} from '@angular/common/http';
import Hls from 'hls.js';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, FormsModule],  // Add CommonModule for ngFor, FormsModule for ngModel
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {

  videoUrl: string = '\n' +
    'Add video url here';  // Your video URL
  subtitleUrl: string = 'https://tum.live/api/stream/26188/subtitles/de';  // WebVTT URL
  subtitles: any[] = [];  // Parsed subtitles
  currentSubtitle: string = '';  // Displayed subtitle
  searchTerm: string = '';  // Search term for filtering
  filteredSubtitles: any[] = [];  // For searching


  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.loadSubtitles();
  }

  @ViewChild('videoPlayer', {static: false}) videoPlayer!: ElementRef;

  ngAfterViewInit(): void {
    const video: HTMLVideoElement = this.videoPlayer.nativeElement;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(this.videoUrl);
      hls.attachMedia(video);
    } else if (typeof video.canPlayType === 'function' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.videoUrl;
    }

    // Ensure subtitle time updates are synced
    this.setupTimeUpdate();
  }


  loadSubtitles() {
    this.http.get(this.subtitleUrl, {responseType: 'text'}).subscribe((data) => {
      // console.log("Raw Subtitle Data:", data);  // Log raw WebVTT data
      this.parseSubtitles(data);  // Parse the WebVTT file
    });
  }


  // Parse WebVTT subtitle file
  parseSubtitles(data: string) {
    const subtitleLines = data.split('\n\n');

    if (subtitleLines[0].startsWith('WEBVTT')) {
      subtitleLines.shift();  // Skip the WEBVTT header
    }

    this.subtitles = subtitleLines.map((block, index) => {
      const [timeLine, ...textLines] = block.split('\n');  // Handle multiline subtitles

      if (timeLine && timeLine.includes('-->')) {
        const [startTime, endTime] = timeLine.split(' --> ');
        const text = textLines.join(' ').trim();  // Combine all text lines for the subtitle block

        if (startTime && endTime && text) {
          return {
            startTime: this.convertToSeconds(startTime.trim()),
            endTime: this.convertToSeconds(endTime.trim()),
            text: text,
          };
        }
      }

      // Log invalid blocks for further debugging
      console.warn(`Invalid subtitle block at index ${index}:`, block);
      return null;
    }).filter(sub => sub !== null);  // Filter out invalid blocks
  }


  convertToSeconds(time: string): number {
    if (!time) {
      console.warn(`Invalid time format: ${time}`);
      return 0;
    }

    const timeParts = time.split(':');

    if (timeParts.length === 2) {
      // Handle MM:SS format
      const minutes = parseInt(timeParts[0], 10);
      const [seconds, milliseconds] = timeParts[1].includes('.')
        ? timeParts[1].split('.')  // Split seconds and milliseconds
        : [timeParts[1], '0'];  // Default milliseconds to 0 if not present
      return (minutes * 60) + parseInt(seconds, 10) + parseFloat(`0.${milliseconds}`);
    } else if (timeParts.length === 3) {
      // Handle HH:MM:SS format
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const [seconds, milliseconds] = timeParts[2].includes('.')
        ? timeParts[2].split('.')  // Split seconds and milliseconds
        : [timeParts[2], '0'];  // Default milliseconds to 0 if not present
      return (hours * 3600) + (minutes * 60) + parseInt(seconds, 10) + parseFloat(`0.${milliseconds}`);
    } else {
      console.warn(`Unexpected time format: ${time}`);
      return 0;  // Return 0 for invalid formats
    }
  }

  setupTimeUpdate() {
    const video = this.videoPlayer.nativeElement;

    video.addEventListener('timeupdate', () => {
      const currentTime = video.currentTime;
      console.log('Current video time:', currentTime);  // Log video time regularly
      this.updateSubtitle(currentTime);
    });

    video.addEventListener('seeking', () => {
      const currentTime = video.currentTime;
      this.updateSubtitle(currentTime);
    });

    video.addEventListener('seeked', () => {
      const currentTime = video.currentTime;
      this.updateSubtitle(currentTime);
    });
  }


  updateSubtitle(currentTime: number) {
    const margin = 0.2;  // Adjust this value as needed

    const subtitle = this.subtitles.find(s => {
      return (s.startTime - margin) <= currentTime && currentTime <= (s.endTime + margin);
    });

    if (subtitle) {
      if (this.currentSubtitle !== subtitle.text) {
        this.currentSubtitle = subtitle.text;
      }
    } else {
      this.currentSubtitle = '';  // Hide subtitle when no match
    }
  }

  searchSubtitles() {
    if (this.searchTerm) {
      this.filteredSubtitles = this.subtitles.filter(subtitle =>
        subtitle.text.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredSubtitles = this.subtitles;
    }
  }

  seekToTime(seconds: number) {
    const videoElement = this.videoPlayer.nativeElement;
    videoElement.currentTime = seconds;
    videoElement.play();
  }


}
