import { Injectable, NgZone } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

// Elements that slide in when they scroll into view. Anything matching these
// is found automatically, also when it appears later (parts, news, articles
// loaded from the server), so the page templates don't need any changes.
const REVEAL = [
  '.section-title',
  '.section-lead',
  '.page-intro > *',
  '.tile',
  '.stat',
  '.value',
  '.service-list li',
  '.services-cta',
  '.video',
  '.gallery-img',
  '.product-card',
  '.article-card',
  '.news-item',
  '.articles-banner',
  '.footer-brand',
  '.footer-col',
].join(',');

// Visible text stays visible for search engines and for the saved page copies
// (scripts/prerender.mjs): the hiding CSS only applies once this class is on
// <html>, and it is never added for robots, the prerender browser, or people
// who asked their device for less motion.
const MOTION_CLASS = 'motion';

@Injectable({ providedIn: 'root' })
export class MotionService {
  private io?: IntersectionObserver;
  private seen = new WeakSet<Element>();
  private scan = 0;

  constructor(private zone: NgZone, private router: Router) {}

  init(): void {
    if (typeof window === 'undefined' || !this.allowed()) return;
    document.documentElement.classList.add(MOTION_CLASS);

    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver((entries) => this.onIntersect(entries), {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12,
      });
      // New content (route change, data from the server) -> look for new elements.
      new MutationObserver(() => this.queueScan()).observe(document.body, { childList: true, subtree: true });
      this.queueScan();
      this.watchScroll();
    });

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const main = document.querySelector('main');
      if (!main) return;
      main.classList.remove('page-in');
      void (main as HTMLElement).offsetWidth; // restart the fade
      main.classList.add('page-in');
    });
  }

  private allowed(): boolean {
    const ua = navigator.userAgent || '';
    if (/bot|crawl|spider|slurp|lighthouse|ecolift-prerender|headless/i.test(ua)) return false;
    if ((navigator as any).webdriver) return false;
    if (!('IntersectionObserver' in window)) return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private queueScan(): void {
    cancelAnimationFrame(this.scan);
    this.scan = requestAnimationFrame(() => this.findNew());
  }

  private findNew(): void {
    document.querySelectorAll(REVEAL).forEach((el) => {
      if (this.seen.has(el)) return;
      this.seen.add(el);
      // Neighbours appear one after another instead of all at once. Cards
      // inside Bootstrap columns are counted by their column.
      const parent = el.parentElement;
      let index = 0;
      if (parent) {
        const peers = Array.from(parent.children).filter((c) => c.matches(REVEAL));
        index = peers.indexOf(el);
        if (peers.length === 1 && parent.parentElement) index = Array.from(parent.parentElement.children).indexOf(parent);
      }
      (el as HTMLElement).style.setProperty('--reveal-delay', `${(index % 6) * 90}ms`);
      el.classList.add('reveal');
      this.io!.observe(el);
    });
  }

  private onIntersect(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target as HTMLElement;
      el.classList.add('is-visible');
      this.io!.unobserve(el);
      if (el.classList.contains('stat')) this.countUp(el);
    }
  }

  // "10+" counts 0 -> 10 and keeps the "+".
  private countUp(stat: HTMLElement): void {
    const strong = stat.querySelector('strong');
    const match = strong?.textContent?.trim().match(/^(\d+)(.*)$/);
    if (!strong || !match) return;
    const target = +match[1];
    const suffix = match[2];
    const start = performance.now();
    const duration = 1400;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      strong.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Thin progress line at the top, shadow under the menu, and the "up" button.
  private watchScroll(): void {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const up = document.createElement('button');
    up.className = 'to-top';
    up.type = 'button';
    up.setAttribute('aria-label', 'Up');
    up.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(up);

    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      document.documentElement.classList.toggle('scrolled', y > 40);
      up.classList.toggle('show', y > 600);
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }
}
