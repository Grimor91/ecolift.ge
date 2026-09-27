import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-adminpanel',
  templateUrl: './adminpanel.component.html',
  styleUrls: ['./adminpanel.component.css']
})
export class AdminpanelComponent {
  product = {
    name: '',
    code: '',
    description: '',
    images: [] as string[], // Store base64 strings of images
  };

  images: string[] = []; // To store preview URLs
  savedProducts: any[] = []; // Array to store saved products

  // Handle image upload
  onImageUpload(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const base64String = e.target.result as string;
          this.images.push(base64String); // Store the base64 image for preview
          this.product.images.push(base64String); // Store the base64 string in the product
        };
        reader.readAsDataURL(file);
      }
    }
  }

  // Handle image removal
  removeImage(index: number): void {
    this.images.splice(index, 1); // Remove preview image
    this.product.images.splice(index, 1); // Remove base64 string from product images
  }

  // Save product function
  onSubmit(): void {
    if (this.product.name && this.product.code && this.product.description && this.product.images.length > 0) {
      // Here, image paths are simulated as base64 strings. In a real scenario,
      // these would be paths on a server or in a database.
      const savedProduct = {
        name: this.product.name,
        code: this.product.code,
        description: this.product.description,
        images: this.product.images,
      };

      // Store the product (simulated) - you might store this in local storage or elsewhere
      this.savedProducts.push(savedProduct);

      // Clear form after saving
      this.product = { name: '', code: '', description: '', images: [] };
      this.images = [];
    }
  }

  // Delete a saved product
  deleteProduct(index: number): void {
    this.savedProducts.splice(index, 1);
  }
}
