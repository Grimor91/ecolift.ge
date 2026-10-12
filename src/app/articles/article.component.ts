import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../shop/api.service';
import { Article } from '../shop/models';
import { SeoService } from '../shop/seo.service';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.css'],
})
export class ArticleComponent implements OnInit, OnDestroy {
  article: Article | null = null;
  notFound = false;
  private subs = new Subscription();

  constructor(
    public api: ApiService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private seo: SeoService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        this.article = null;
        this.notFound = false;
        this.api.getArticle(params.get('slug') || '').subscribe({
          next: (a) => {
            this.article = a;
            this.setSeo();
          },
          error: () => (this.notFound = true),
        });
      })
    );
    this.subs.add(this.translate.onLangChange.subscribe(() => this.setSeo()));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private setSeo(): void {
    const a = this.article as any;
    if (!a) return;
    const lang = this.translate.currentLang || 'ka';
    const title = a[`title_${lang}`] || a.title_ka;
    this.seo.setPage(`${title} | Ecolift`, a[`summary_${lang}`] || a.summary_ka || title);
  }
}
