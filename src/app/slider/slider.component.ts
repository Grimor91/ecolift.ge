import { Component, OnInit } from '@angular/core';
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
export class SliderComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
