import { Component, OnInit, Renderer2 } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { CartService } from '../shop/cart.service';
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
})
export class NavComponent implements OnInit {
  // Define the default language code
  private readonly defaultLanguage: string = 'ka';

  constructor(
    private translate: TranslateService,
    private router: Router,
    private scroller: ViewportScroller,
    public cart: CartService,
  ) {
    // A ?lang=en or ?lang=ru address (the ones Google lists for English and
    // Russian searches) wins; otherwise the visitor's last choice, else Georgian.
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl && ['ka', 'en', 'ru'].includes(fromUrl)) localStorage.setItem('selectedLanguage', fromUrl);
    const selectedLanguage = localStorage.getItem('selectedLanguage');

    // Set the language to the stored language or use the default language
    this.translate.use(selectedLanguage || this.defaultLanguage);
  }

  scrollToContact() {
    // Scrolls to the element with id="contact-us"
    this.scroller.scrollToAnchor('contactusid');
  }

  ngOnInit(): void {}

  toggleLanguage(languageCode: string, event: any) {
    this.translate.use(languageCode);

    // Save the selected language to local storage
    localStorage.setItem('selectedLanguage', languageCode);

    // Drop a ?lang= from the address, or reloading would switch back to it.
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }

    // Close the dropdown (if needed)
    this.closeDropdown();
  }

  closeDropdown(): void {
    const dropdownToggle = document.querySelector(
      '.navbar-toggler',
    ) as HTMLElement;
    dropdownToggle.click();
  }
}
