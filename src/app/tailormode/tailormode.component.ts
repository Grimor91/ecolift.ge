import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  animate,
  style as animationStyle,
  transition,
  trigger,
  AnimationEvent,
  style,
} from '@angular/animations';

@Component({
  selector: 'app-tailormode',
  templateUrl: './tailormode.component.html',
  styleUrls: ['./tailormode.component.css'],
  animations: [
    trigger('animation', [
      transition('void => visible', [
        animationStyle({ opacity: 0, transform: 'scale(0.5)' }),
        animate('150ms', animationStyle({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition('visible => void', [
        animate(
          '150ms',
          animationStyle({ opacity: 0, transform: 'scale(0.5)' })
        ),
      ]),
    ]),
    trigger('animation2',[
      transition(':leave', [
        style({opacity:1}),
        animate('50ms', style({opacity:0.8}))
      ])
    ])
  ],
})
export class TailormodeComponent {

  @Input() showcount = false;
  
  constructor(private actroute: ActivatedRoute) {}
  
  data: item[] = [
    
    
    
  ];
  
  previewimage = false;
  showmask = false;
  currentLightboxImage: item = this.data[0];
  currentIndex = 0;
  controls = true;
  totalimagecount = 0;
  
  ngOnInit(): void {
    this.totalimagecount = this.data.length;
  }
  
  onPrewieimg(index: number): void {
    this.showmask = true;
    this.previewimage = true;
    this.currentIndex = index;
    this.currentLightboxImage = this.data[index];
    console.log('Clicked on image:', index);
  }
  
  onanimationend(event: AnimationEvent) {
    if (event.toState === 'void') {
      this.showmask = false;
    }
  }
  
  onclosepreview() {
    this.previewimage = false;
  }
  
  next(): void {
    this.currentIndex = this.currentIndex + 1;
    if (this.currentIndex > this.data.length - 1) {
      this.currentIndex = 0;
    }
    this.currentLightboxImage = this.data[this.currentIndex];
  }
  
  prev(): void {
    this.currentIndex = this.currentIndex - 1;
    if (this.currentIndex < 0) {
      this.currentIndex = this.data.length - 1;
    }
    this.currentLightboxImage = this.data[this.currentIndex];
  }
}
interface item {
  imageSrc: string;
  imageAlt: string;
}


