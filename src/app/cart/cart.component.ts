import { Component } from '@angular/core';
import { ApiService } from '../shop/api.service';
import { CartService } from '../shop/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent {
  form = { name: '', phone: '', email: '', company: '', comment: '' };
  sending = false;
  error = false;
  orderId: number | null = null;

  constructor(public cart: CartService, public api: ApiService) {}

  submit(): void {
    if (this.sending || !this.cart.items.length) return;
    this.sending = true;
    this.error = false;
    this.api
      .placeOrder({
        ...this.form,
        items: this.cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      .subscribe({
        next: (res) => {
          this.orderId = res.id;
          this.cart.clear();
          this.sending = false;
        },
        error: () => {
          this.error = true;
          this.sending = false;
        },
      });
  }
}
