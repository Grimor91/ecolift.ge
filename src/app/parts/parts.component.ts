import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../shop/api.service';
import { CartService } from '../shop/cart.service';
import { Category, Product } from '../shop/models';
import { PART_BRANDS } from '../part-finder/part-finder.component';

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
  brands = PART_BRANDS;

  constructor(
    public api: ApiService,
    private cart: CartService,
    private translate: TranslateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({ next: (c) => (this.categories = c), error: () => {} });
    // The assistant's "see all" link opens the catalog with its search filled in.
    this.route.queryParamMap.subscribe((params) => {
      this.search = params.get('search') || this.search;
      this.load();
    });
  }

  get pages(): number {
    return Math.ceil(this.total / this.limit);
  }

  /** The brand whose name is the current search, if any. */
  get activeBrand(): string | null {
    const s = this.search.trim().toLowerCase();
    return this.brands.find((b) => b.search.toLowerCase() === s)?.search ?? null;
  }

  /** Page numbers to show: first, last and two around the current one; 0 = "…". */
  get pageList(): number[] {
    const last = this.pages;
    const out: number[] = [];
    for (let n = 1; n <= last; n++) {
      if (n === 1 || n === last || Math.abs(n - this.page) <= 2) out.push(n);
      else if (out[out.length - 1] !== 0) out.push(0);
    }
    return out;
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
        if (window.scrollY > 300) window.scrollTo({ top: 0, behavior: 'smooth' });
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

  selectBrand(search: string | null): void {
    this.search = search ?? '';
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
