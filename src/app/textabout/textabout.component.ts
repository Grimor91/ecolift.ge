import { Component, Input } from '@angular/core';

/** "What we do" cards and the company video. The home page shows only the video;
 *  the about page shows the cards. */
@Component({
  selector: 'app-textabout',
  templateUrl: './textabout.component.html',
  styleUrls: ['./textabout.component.css'],
})
export class TextaboutComponent {
  @Input() cards = true;
  @Input() video = true;
}
