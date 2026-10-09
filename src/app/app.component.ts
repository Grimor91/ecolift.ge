import { Component } from '@angular/core';
import { SeoService } from './shop/seo.service';
import { VisitService } from './shop/visit.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ecoliftplus';
  year = new Date().getFullYear();

  constructor(seo: SeoService, visits: VisitService) {
    seo.init();
    visits.init();
  }
}
