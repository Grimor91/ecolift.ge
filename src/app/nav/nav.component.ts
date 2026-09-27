import { Component, OnInit, Renderer2 } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
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
  ) {
    // Get the selected language from local storage
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
