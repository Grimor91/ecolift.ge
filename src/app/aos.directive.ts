import { Directive, AfterViewInit } from '@angular/core';
import * as AOS from 'aos';

@Directive({
  selector: '[appAos]'
})
export class AosDirective implements AfterViewInit {
  ngAfterViewInit(): void {
    AOS.init();
  }
}
