import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Hls from 'hls.js';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, AfterViewInit {

  videoUrl: string = '\n' +
    'video url';  // Your video URL
  subtitleUrl: string = 'https://tum.live/api/stream/26188/subtitles/de';  // WebVTT URL
  subtitles: any[] = [];
  filteredSubtitles: any[] = [];
  currentSubtitleIndex: number = -1;
  currentSubtitle: string = '';
  searchTerm: string = '';  // Search term

  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSubtitles();
  }

  ngAfterViewInit(): void {
    const video: HTMLVideoElement = this.videoPlayer.nativeElement;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(this.videoUrl);
      hls.attachMedia(video);
    } else if (typeof video.canPlayType === 'function' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.videoUrl;
    }

    this.setupTimeUpdate();
  }

  loadSubtitles() {
    this.http.get(this.subtitleUrl, { responseType: 'text' }).subscribe((data) => {
      this.parseSubtitles(data);
      this.filteredSubtitles = this.subtitles;  // Initialize filtered subtitles
    });
  }

  parseSubtitles(data: string) {
    const subtitleLines = data.split('\n\n');
    if (subtitleLines[0].startsWith('WEBVTT')) {
      subtitleLines.shift();
    }

    this.subtitles = subtitleLines.map((block) => {
      const [timeLine, ...textLines] = block.split('\n');

      if (timeLine && timeLine.includes('-->')) {
        const [startTime, endTime] = timeLine.split(' --> ');
        const text = textLines.join(' ').trim();

        if (startTime && endTime && text) {
          return {
            startTime: this.convertToSeconds(startTime.trim()),
            endTime: this.convertToSeconds(endTime.trim()),
            text: text,
          };
        }
      }
      return null;
    }).filter(sub => sub !== null);
  }

  convertToSeconds(time: string): number {
    const timeParts = time.split(':');
    if (timeParts.length === 2) {
      const minutes = parseInt(timeParts[0], 10);
      const [seconds, milliseconds] = timeParts[1].includes('.')
        ? timeParts[1].split('.')
        : [timeParts[1], '0'];
      return (minutes * 60) + parseInt(seconds, 10) + parseFloat(`0.${milliseconds}`);
    } else if (timeParts.length === 3) {
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const [seconds, milliseconds] = timeParts[2].includes('.')
        ? timeParts[2].split('.')
        : [timeParts[2], '0'];
      return (hours * 3600) + (minutes * 60) + parseInt(seconds, 10) + parseFloat(`0.${milliseconds}`);
    }
    return 0;
  }

  setupTimeUpdate() {
    const video = this.videoPlayer.nativeElement;

    video.addEventListener('timeupdate', () => {
      const currentTime = video.currentTime;
      this.updateSubtitle(currentTime);
    });

    video.addEventListener('seeking', () => {
      this.updateSubtitle(video.currentTime);
    });

    video.addEventListener('seeked', () => {
      this.updateSubtitle(video.currentTime);
    });
  }

  updateSubtitle(currentTime: number) {
    const margin = 0.2;

    const subtitle = this.subtitles.find((s, index) => {
      if ((s.startTime - margin) <= currentTime && currentTime <= (s.endTime + margin)) {
        this.currentSubtitleIndex = index;
        console.log("Current subtitle index:", this.currentSubtitleIndex); // Debugging line
        return true;
      }
      return false;
    });

    if (subtitle) {
      this.currentSubtitle = subtitle.text;
    } else {
      this.currentSubtitle = '';
    }

    this.scrollToCurrentSubtitle();
  }


  scrollToCurrentSubtitle() {
    const subtitleElements = document.querySelectorAll('.subtitle-list-container li');
    const currentSubtitleElement = subtitleElements[this.currentSubtitleIndex];

    if (currentSubtitleElement) {
      currentSubtitleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  // HostListener to detect outside clicks
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (target.id !== 'subtitleSearch') {
      this.searchTerm = '';  // Clear search term
      this.filteredSubtitles = this.subtitles;  // Reset to all subtitles
    }
  }
}
