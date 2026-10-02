import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../shop/api.service';
import { NewsPost } from '../shop/models';

// The server only stores ids that match urn:li:(share|activity|ugcPost):<digits>.
const URN = /^urn:li:(share|activity|ugcPost):\d+$/;

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
})
export class NewsComponent implements OnInit {
  /** 0 = every post (the /news page); the home page shows the latest few. */
  @Input() limit = 0;

  posts: { post: NewsPost; src: SafeResourceUrl }[] = [];
  loaded = false;

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.api.getNews(this.limit || undefined).subscribe({
      next: (posts) => {
        this.posts = posts
          .filter((p) => URN.test(p.urn))
          .map((post) => ({
            post,
            src: this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.linkedin.com/embed/feed/update/${post.urn}`),
          }));
        this.loaded = true;
      },
      error: () => (this.loaded = true),
    });
  }
}
