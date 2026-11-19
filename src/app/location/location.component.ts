import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

// The office on a Google map (embedded page, no API key or script needed) with a
// "get directions" button. Shown at the bottom of the home page.
const PLACE = encodeURIComponent('13 David Mamuladze St, Batumi, Georgia');
const MAP = (lang: string) => `https://www.google.com/maps?q=${PLACE}&z=16&hl=${lang}&output=embed`;

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
})
export class LocationComponent implements OnInit, OnDestroy {
  mapUrl!: SafeResourceUrl;
  readonly directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${PLACE}`;
  private sub?: Subscription;

  constructor(private sanitizer: DomSanitizer, private translate: TranslateService) {}

  ngOnInit(): void {
    this.setMap(this.translate.currentLang);
    this.sub = this.translate.onLangChange.subscribe((e) => this.setMap(e.lang));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private setMap(lang: string | undefined): void {
    const hl = ['ka', 'en', 'ru'].includes(lang || '') ? lang! : 'ka';
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(MAP(hl));
  }
}
