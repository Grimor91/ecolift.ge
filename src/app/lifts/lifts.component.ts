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
    { imageSrc: 'assets/lifts/passenger/passenger-02.jpg', imageAlt: 'ოქროსფერი სამგზავრო ლიფტის კაბინა', downloadUrl: 'assets/lifts/passenger/passenger-02.jpg' },
    { imageSrc: 'assets/lifts/passenger/passenger-05.jpg', imageAlt: 'სპილენძისფერი პანელები და LED ჭერი', downloadUrl: 'assets/lifts/passenger/passenger-05.jpg' },
    { imageSrc: 'assets/lifts/passenger/passenger-07.jpg', imageAlt: 'ლიფტი კერძო სახლში', downloadUrl: 'assets/lifts/passenger/passenger-07.jpg' },
    { imageSrc: 'assets/lifts/passenger/passenger-01.jpg', imageAlt: 'სამგზავრო ლიფტი უჟანგავი ფოლადის კაბინით', downloadUrl: 'assets/lifts/passenger/passenger-01.jpg' },
    { imageSrc: 'assets/lifts/passenger/passenger-06.jpg', imageAlt: 'შუშის კაბინა მარმარილოს იატაკით', downloadUrl: 'assets/lifts/passenger/passenger-06.jpg' },
    { imageSrc: 'assets/lifts/freight/freight-01.jpg', imageAlt: 'მცირე სატვირთო ლიფტი (dumbwaiter)', downloadUrl: 'assets/lifts/freight/freight-01.jpg' },
    { imageSrc: 'assets/lifts/passenger/passenger-03.jpg', imageAlt: 'სპილენძისფერი სამგზავრო ლიფტის კაბინა', downloadUrl: 'assets/lifts/passenger/passenger-03.jpg' },
    { imageSrc: 'assets/lifts/passenger/passenger-10.jpg', imageAlt: 'ოქროსფერი კაბინა თაღოვანი დეკორით', downloadUrl: 'assets/lifts/passenger/passenger-10.jpg' },
    { imageSrc: 'assets/lifts/passenger/passenger-09.jpg', imageAlt: 'ლიფტი მარმარილოს მოპირკეთებით', downloadUrl: 'assets/lifts/passenger/passenger-09.jpg' },
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