import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/**
 * Tells the server about every page a visitor opens, for the admin
 * "visitors" tab. The admin's own browsing is not counted.
 */
@Injectable({ providedIn: 'root' })
export class VisitService {
  private first = true;

  constructor(
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  init(): void {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const path = e.urlAfterRedirects.split(/[?#]/)[0];
      // Where the visitor came from only matters for the page they landed on.
      const referrer = this.first ? this.doc.referrer : '';
      this.first = false;
      if (path.startsWith('/admin') || this.auth.isLoggedIn) return;
      this.api.recordVisit(path, referrer).subscribe({ error: () => {} });
    });
  }
}
