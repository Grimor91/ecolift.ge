import { AfterViewChecked, Component, ElementRef, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { ApiService } from '../shop/api.service';
import { AssistantAction, AssistantProduct } from '../shop/models';

interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  extraText?: string | null;
  products?: AssistantProduct[];
  actions?: AssistantAction[];
  searchQuery?: string | null;
}

// Where each answer button leads. Labels are in the translation files (assistant.action.*).
const ACTION_LINKS: Record<AssistantAction, { route?: string; href?: string; icon: string }> = {
  service: { route: '/service', icon: 'fa-screwdriver-wrench' },
  quote: { route: '/quote', icon: 'fa-file-invoice' },
  parts: { route: '/parts', icon: 'fa-gears' },
  lifts: { route: '/lifts', icon: 'fa-elevator' },
  escalators: { route: '/escolator', icon: 'fa-stairs' },
  articles: { route: '/articles', icon: 'fa-book-open' },
  call: { href: 'tel:+995598750006', icon: 'fa-phone' },
  contact: { href: 'https://wa.me/995598750006', icon: 'fa-whatsapp' },
};

@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.css'],
})
export class AssistantComponent implements AfterViewChecked {
  @ViewChild('log') log?: ElementRef<HTMLElement>;

  open = false;
  hidden = false;
  input = '';
  sending = false;
  messages: ChatMessage[] = [];
  readonly quick = ['findPart', 'broken', 'newLift', 'contact'];
  readonly links = ACTION_LINKS;
  private scrollPending = false;

  constructor(public api: ApiService, private translate: TranslateService, router: Router) {
    // The admin panel has no use for the chat window.
    router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.hidden = (e as NavigationEnd).urlAfterRedirects.startsWith('/admin');
    });
  }

  ngAfterViewChecked(): void {
    if (this.scrollPending && this.log) {
      this.log.nativeElement.scrollTop = this.log.nativeElement.scrollHeight;
      this.scrollPending = false;
    }
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open && !this.messages.length) {
      this.messages.push({ from: 'bot', text: this.translate.instant('assistant.welcome') });
    }
  }

  ask(key: string): void {
    this.send(this.translate.instant(`assistant.quick.${key}`));
  }

  send(text = this.input): void {
    const message = text.trim();
    if (!message || this.sending) return;
    this.input = '';
    this.messages.push({ from: 'user', text: message });
    this.sending = true;
    this.scrollPending = true;
    this.api.askAssistant(message, this.translate.currentLang || 'ka').subscribe({
      next: (r) => {
        this.messages.push({ from: 'bot', ...r });
        this.sending = false;
        this.scrollPending = true;
      },
      error: () => {
        this.messages.push({ from: 'bot', text: this.translate.instant('assistant.error'), actions: ['call'] });
        this.sending = false;
        this.scrollPending = true;
      },
    });
  }

  /** Opening a page from the chat closes the window on phones, where it covers the page. */
  followed(): void {
    if (window.innerWidth < 768) this.open = false;
  }
}
