import { Component, Input } from '@angular/core';
import {
  animate,
  style as animationStyle,
  transition,
  trigger,
  AnimationEvent,
  style,
} from '@angular/animations';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-lifts',
  templateUrl: './lifts.component.html',
  styleUrls: ['./lifts.component.css'],
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
export class LiftsComponent {


  @Input() showcount = false;
  
  constructor(private actroute: ActivatedRoute) {}
  
  data: item[] = [
    
    
    {
      imageSrc: 'assets/lifts/image_2024-01-13_14-58-39.png',
      imageAlt: '3',
      downloadUrl:'assets/lifts/image_2024-01-13_14-58-39.png'
    },
    {
      imageSrc: 'assets/lifts/image_2024-01-13_15-01-12.png',
      imageAlt: '4',
      downloadUrl:'assets/lifts/image_2024-01-13_15-01-12.png'
    },
    {
      imageSrc: 'assets/lifts/image_2024-01-13_15-09-39.png',
      imageAlt: '5',
      downloadUrl:'assets/lifts/image_2024-01-13_15-09-39.png'
    },
    {
      imageSrc: 'assets/lifts/image_2024-01-13_15-10-53.png',
      imageAlt: '6',
      downloadUrl:'assets/lifts/image_2024-01-13_15-10-53.png'
    },
    
    
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

  downloadImage(downloadUrl: string): void {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'image.png'; // You can set a custom filename
    link.click();
  }
  
}
interface item {
  imageSrc: string;
  imageAlt: string;
  downloadUrl:string;
}