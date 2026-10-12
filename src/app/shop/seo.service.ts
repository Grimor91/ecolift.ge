import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

const SITE = 'https://ecolift.ge';
const LANGS = ['ka', 'en', 'ru'];

/** Georgian pages have the plain address; English and Russian add ?lang=. */
const langUrl = (url: string, lang: string) => (lang === 'ka' ? url : `${url}?lang=${lang}`);

/**
 * Sets the browser title, meta description, canonical and language links and page language
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
    const lang = this.translate.currentLang || 'ka';
    this.doc.documentElement.lang = lang;
    const path = SITE + this.router.url.split(/[?#]/)[0];
    this.setLink('canonical', null, langUrl(path, lang));
    for (const l of LANGS) this.setLink('alternate', l, langUrl(path, l));
    this.setLink('alternate', 'x-default', path);
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

  private setLink(rel: string, hreflang: string | null, url: string): void {
    const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
    let link = this.doc.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = rel;
      if (hreflang) link.hreflang = hreflang;
      this.doc.head.appendChild(link);
    }
    link.href = url;
  }
}
