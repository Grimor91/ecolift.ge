import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      transition('* => *', [  // Use * for wildcard transition
        animate('1s', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class SliderComponent implements OnInit, AfterViewInit {
  @ViewChild('esc') esc?: ElementRef<HTMLVideoElement>;

  constructor() { }

  ngOnInit(): void {
  }

  // Browsers only autoplay muted clips; Angular doesn't always set the
  // muted property from the attribute, so set it and start the clip here.
  ngAfterViewInit(): void {
    const video = this.esc?.nativeElement;
    if (!video) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }
    video.muted = true;
    video.play?.()?.catch(() => {});
  }

}
