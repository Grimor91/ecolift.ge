import { Component, HostListener } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CartService } from '../shop/cart.service';

// Header menu. Styles are in src/theme.css (".site-nav"), so they don't count
// against the per-component CSS budget in angular.json.
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  private readonly defaultLanguage: string = 'ka';
  menuOpen = false;
  openGroup: string | null = null;

  readonly langs = [
    { code: 'ka', label: 'ქართული' },
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ];
  readonly flags: Record<string, string> = {
    ka: 'assets/img/photo_2023-10-26_21-05-40.jpg',
    en: 'assets/img/photo_2023-10-26_21-07-49.jpg',
    ru: 'assets/img/photo_2023-10-26_21-08-44.jpg',
  };

  constructor(private translate: TranslateService, public cart: CartService) {
    // A ?lang=en or ?lang=ru address (the ones Google lists for English and
    // Russian searches) wins; otherwise the visitor's last choice, else Georgian.
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl && ['ka', 'en', 'ru'].includes(fromUrl)) localStorage.setItem('selectedLanguage', fromUrl);
    const selectedLanguage = localStorage.getItem('selectedLanguage');
    this.translate.use(selectedLanguage || this.defaultLanguage);
  }

  get currentLang(): string {
    return this.translate.currentLang || this.defaultLanguage;
  }

  toggleGroup(name: string): void {
    this.openGroup = this.openGroup === name ? null : name;
  }

  toggleLanguage(languageCode: string, event: Event) {
    event.stopPropagation();
    this.translate.use(languageCode);
    localStorage.setItem('selectedLanguage', languageCode);

    // Drop a ?lang= from the address, or reloading would switch back to it.
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
    this.closeMenu();
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.openGroup = null;
  }

  /** A click anywhere outside the header closes an open dropdown. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.openGroup && !(event.target as HTMLElement).closest?.('.site-nav')) this.openGroup = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }
}
