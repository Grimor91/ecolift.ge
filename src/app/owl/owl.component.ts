import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-owl',
  templateUrl: './owl.component.html',
  styleUrls: ['./owl.component.css'],
  
})
export class OwlComponent implements AfterViewInit {
  @ViewChild('owlCarousel') owlCarousel: any; 
  customOptions: OwlOptions = {
    
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    autoplay: true,
    
    autoplaySpeed: 2000,
    autoplayTimeout: 2100,
    slideTransition: 'linear',
    autoplayHoverPause: false,
    rewind: true, 
    navSpeed: false,
    navText: ['Prev', 'Next'],
    
    responsive: {
      0: {
        items: 1,
        center:true,
        
      },
      400: {
        items: 1,
        center:true,
        
      },
      570: {
        items: 2,
        
      },
      660: {
        items: 2,
        
      },
      704: {
        items: 2,
       
      },
      740: {
        items: 3,
        
      },

      1200: {
        items: 4,
        
      },
    },
    nav: false,
  };

  ngAfterViewInit() {
    // Start carousel autoplay once the view is initialized
    this.owlCarousel.next(true);
  }
}
