import { Component } from '@angular/core';
import { SeoService } from './shop/seo.service';
import { VisitService } from './shop/visit.service';
import { MotionService } from './shop/motion.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ecoliftplus';
  year = new Date().getFullYear();

  constructor(seo: SeoService, visits: VisitService, motion: MotionService) {
    seo.init();
    visits.init();
    motion.init();
  }
}
