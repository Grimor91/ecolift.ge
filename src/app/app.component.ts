import { Component } from '@angular/core';

interface item {
  imageSrc:string
  imageAlt:string

}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'ecoliftplus';
 
}
