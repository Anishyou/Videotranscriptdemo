import { Component } from '@angular/core';
import { VideoPlayerComponent } from './video-player/video-player.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VideoPlayerComponent],  // Import the standalone VideoPlayerComponent
  template: `
    <h1>Video Player</h1>
    <app-video-player></app-video-player>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Standalone Video App';
}
