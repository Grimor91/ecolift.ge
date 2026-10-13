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
  selector: 'app-cardpassenger',
  templateUrl: './cardpassenger.component.html',
  styleUrls: ['./cardpassenger.component.css'],
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
export class CardpassengerComponent implements OnInit {
  @Input() showcount = false;
  
  constructor(private actroute: ActivatedRoute) {}
  
  data: item[] = [
    { imageSrc: 'assets/lifts/passenger/passenger-01.jpg', imageAlt: 'სამგზავრო ლიფტი უჟანგავი ფოლადის კაბინით' },
    { imageSrc: 'assets/lifts/passenger/passenger-02.jpg', imageAlt: 'ოქროსფერი კაბინა სენსორული ეკრანიანი მართვის პანელით' },
    { imageSrc: 'assets/lifts/passenger/passenger-03.jpg', imageAlt: 'სპილენძისფერი სამგზავრო ლიფტის კაბინა' },
    { imageSrc: 'assets/lifts/passenger/passenger-04.jpg', imageAlt: 'სამგზავრო ლიფტი ოფისის ფოიეში' },
    { imageSrc: 'assets/lifts/passenger/passenger-05.jpg', imageAlt: 'სპილენძისფერი პანელები და LED ჭერი' },
    { imageSrc: 'assets/lifts/passenger/passenger-06.jpg', imageAlt: 'შუშის კაბინა მარმარილოს იატაკით' },
    { imageSrc: 'assets/lifts/passenger/passenger-07.jpg', imageAlt: 'ლიფტი კერძო სახლში' },
    { imageSrc: 'assets/lifts/passenger/passenger-08.jpg', imageAlt: 'უჟანგავი ფოლადის კაბინა' },
    { imageSrc: 'assets/lifts/passenger/passenger-09.jpg', imageAlt: 'ლიფტი მარმარილოს მოპირკეთებით' },
    { imageSrc: 'assets/lifts/passenger/passenger-10.jpg', imageAlt: 'ოქროსფერი კაბინა თაღოვანი დეკორით' },
    { imageSrc: 'assets/lifts/passenger/passenger-11.jpg', imageAlt: 'მართვის პანელი, 1000 კგ, 13 მგზავრი' },
    { imageSrc: 'assets/lifts/passenger/passenger-12.jpg', imageAlt: 'კაბინის LED ჭერი' },
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
