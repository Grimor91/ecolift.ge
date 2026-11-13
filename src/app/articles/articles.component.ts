import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shop/api.service';
import { Article } from '../shop/models';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.css'],
})
export class ArticlesComponent implements OnInit {
  articles: Article[] = [];
  loaded = false;

  constructor(public api: ApiService) {}

  ngOnInit(): void {
    this.api.getArticles().subscribe({
      next: (a) => {
        this.articles = a;
        this.loaded = true;
      },
      error: () => (this.loaded = true),
    });
  }
}
