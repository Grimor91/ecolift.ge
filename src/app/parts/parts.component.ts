import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../shop/api.service';
import { CartService } from '../shop/cart.service';
import { Category, Product } from '../shop/models';

@Component({
  selector: 'app-parts',
  templateUrl: './parts.component.html',
  styleUrls: ['./parts.component.css'],
})
export class PartsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  search = '';
  category: number | null = null;
  page = 1;
  total = 0;
  limit = 24;
  loading = false;
  error = false;
  addedId: number | null = null;

  constructor(public api: ApiService, private cart: CartService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (c) => (this.categories = c), error: () => {} });
    this.load();
  }

  get pages(): number {
    return Math.ceil(this.total / this.limit);
  }

  load(page = 1): void {
    this.page = page;
    this.loading = true;
    this.error = false;
    this.api.getProducts({ search: this.search.trim(), category: this.category, page }).subscribe({
      next: (res) => {
        this.products = res.items;
        this.total = res.total;
        this.limit = res.limit;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  selectCategory(id: number | null): void {
    this.category = id;
    this.load();
  }

  addToCart(p: Product): void {
    const lang = this.translate.currentLang || 'ka';
    this.cart.add({
      productId: p.id,
      code: p.code,
      name: (p as any)[`name_${lang}`] || p.name_ka,
      image: p.images[0]?.url ?? null,
    });
    this.addedId = p.id;
    setTimeout(() => (this.addedId = null), 1500);
  }
}
