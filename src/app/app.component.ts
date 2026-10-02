import { Component } from '@angular/core';
import { SeoService } from './shop/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ecoliftplus';
  year = new Date().getFullYear();

  constructor(seo: SeoService) {
    seo.init();
  }
}
