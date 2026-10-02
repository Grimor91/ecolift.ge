import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

const SITE = 'https://ecolift.ge';

/**
 * Sets the browser title, meta description, canonical link and page language
 * for every route, so each page shows up in Google with its own text.
 * Pages name their texts with `data: { seo: '<key>' }` in the routing module
 * (translations under `seo.<key>`); the part page sets its own via setPage().
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private key = 'home';
  private custom: { title: string; description: string } | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  init(): void {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      this.key = r.snapshot.data['seo'] || 'home';
      this.custom = null;
      this.meta.updateTag({ name: 'robots', content: r.snapshot.data['noindex'] ? 'noindex' : 'index, follow' });
      this.apply();
    });
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  /** Used by pages whose text comes from the database, such as a part. */
  setPage(title: string, description: string): void {
    this.custom = { title, description };
    this.apply();
  }

  private apply(): void {
    this.doc.documentElement.lang = this.translate.currentLang || 'ka';
    this.setCanonical(SITE + this.router.url.split(/[?#]/)[0]);
    if (this.custom) {
      this.set(this.custom.title, this.custom.description);
      return;
    }
    this.translate.get([`seo.${this.key}.title`, `seo.${this.key}.description`]).subscribe((t) => {
      this.set(t[`seo.${this.key}.title`], t[`seo.${this.key}.description`]);
    });
  }

  private set(title: string, description: string): void {
    // Missing translations come back as the key itself; keep index.html's text then.
    if (title && !title.startsWith('seo.')) this.title.setTitle(title);
    if (description && !description.startsWith('seo.')) {
      this.meta.updateTag({ name: 'description', content: description.slice(0, 300) });
      this.meta.updateTag({ property: 'og:title', content: this.title.getTitle() });
      this.meta.updateTag({ property: 'og:description', content: description.slice(0, 300) });
    }
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = url;
  }
}
