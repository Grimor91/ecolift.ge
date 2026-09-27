import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../shop/api.service';
import { CartService } from '../shop/cart.service';
import { Product } from '../shop/models';

@Component({
  selector: 'app-part-detail',
  templateUrl: './part-detail.component.html',
  styleUrls: ['./part-detail.component.css'],
})
export class PartDetailComponent implements OnInit {
  product: Product | null = null;
  notFound = false;
  selectedImage = 0;
  quantity = 1;
  added = false;

  constructor(
    public api: ApiService,
    private route: ActivatedRoute,
    private cart: CartService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getProduct(id).subscribe({
      next: (p) => (this.product = p),
      error: () => (this.notFound = true),
    });
  }

  addToCart(): void {
    if (!this.product) return;
    const p = this.product;
    const lang = this.translate.currentLang || 'ka';
    this.cart.add(
      {
        productId: p.id,
        code: p.code,
        name: (p as any)[`name_${lang}`] || p.name_ka,
        image: p.images[0]?.url ?? null,
      },
      Math.max(1, Math.floor(this.quantity) || 1)
    );
    this.added = true;
  }
}
