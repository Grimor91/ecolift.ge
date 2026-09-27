import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-parts',
  templateUrl: './parts.component.html',
  styleUrls: ['./parts.component.css'],
})
export class PartsComponent implements OnInit {
  products: any[] = [];

  ngOnInit(): void {
    this.loadProducts();
  }

  // Load products from local storage or a service
  loadProducts(): void {
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
      this.products = JSON.parse(savedProducts);
    }
  }

  // Delete a product
  deleteProduct(product: any): void {
    const index = this.products.indexOf(product);
    if (index > -1) {
      this.products.splice(index, 1);
      this.saveProducts();
    }
  }

  // Save updated product list
  saveProducts(): void {
    localStorage.setItem('products', JSON.stringify(this.products));
  }
}
