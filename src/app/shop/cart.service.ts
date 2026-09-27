import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from './models';

const STORAGE_KEY = 'cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.load());
  readonly items$ = this.itemsSubject.asObservable();

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  get count(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  add(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
    const existing = this.items.find((i) => i.productId === item.productId);
    const items = existing
      ? this.items.map((i) => (i === existing ? { ...i, quantity: i.quantity + quantity } : i))
      : [...this.items, { ...item, quantity }];
    this.save(items);
  }

  setQuantity(productId: number, quantity: number): void {
    if (quantity < 1) return this.remove(productId);
    this.save(this.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
  }

  remove(productId: number): void {
    this.save(this.items.filter((i) => i.productId !== productId));
  }

  clear(): void {
    this.save([]);
  }

  private save(items: CartItem[]): void {
    this.itemsSubject.next(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }

  private load(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }
}
