import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, NewsPost, Order, OrderRequest, Product, ProductPage, QuoteRequest, QuoteRequestInput, ServiceRequest, ServiceRequestInput } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  imageUrl(url: string): string {
    return this.base + url;
  }

  getProducts(opts: { search?: string; category?: number | null; page?: number } = {}): Observable<ProductPage> {
    let params = new HttpParams();
    if (opts.search) params = params.set('search', opts.search);
    if (opts.category) params = params.set('category', opts.category);
    if (opts.page) params = params.set('page', opts.page);
    return this.http.get<ProductPage>(`${this.base}/products`, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  placeOrder(order: OrderRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/orders`, order);
  }

  sendServiceRequest(request: ServiceRequestInput): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/service-requests`, request);
  }

  sendQuoteRequest(request: QuoteRequestInput, drawing: File | null): Observable<{ id: number }> {
    const data = new FormData();
    for (const [key, value] of Object.entries(request)) {
      if (value !== null && value !== undefined) data.append(key, String(value));
    }
    if (drawing) data.append('drawing', drawing);
    return this.http.post<{ id: number }>(`${this.base}/quote-requests`, data);
  }

  getNews(limit?: number): Observable<NewsPost[]> {
    // The time stamp skips any copy the host cached before the API sent no-store.
    let params = new HttpParams().set('t', Date.now());
    if (limit) params = params.set('limit', limit);
    return this.http.get<NewsPost[]>(`${this.base}/news`, { params });
  }

  // ---- Admin ----

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.base}/admin/login`, { email, password });
  }

  adminProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/admin/products`);
  }

  saveProduct(data: FormData, id?: number): Observable<Product> {
    return id
      ? this.http.put<Product>(`${this.base}/admin/products/${id}`, data)
      : this.http.post<Product>(`${this.base}/admin/products`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/products/${id}`);
  }

  deleteImage(productId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/products/${productId}/images/${imageId}`);
  }

  addCategory(name_ka: string, name_en: string, name_ru: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.base}/admin/categories`, { name_ka, name_en, name_ru });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/categories/${id}`);
  }

  adminOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/admin/orders`);
  }

  setOrderStatus(id: number, status: Order['status']): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/orders/${id}`, { status });
  }

  adminServiceRequests(): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(`${this.base}/admin/service-requests`);
  }

  setServiceRequestStatus(id: number, status: ServiceRequest['status']): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/service-requests/${id}`, { status });
  }

  adminQuoteRequests(): Observable<QuoteRequest[]> {
    return this.http.get<QuoteRequest[]>(`${this.base}/admin/quote-requests`);
  }

  quoteDrawing(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/admin/quote-requests/${id}/drawing`, { responseType: 'blob' });
  }

  setQuoteRequestStatus(id: number, status: QuoteRequest['status']): Observable<void> {
    return this.http.patch<void>(`${this.base}/admin/quote-requests/${id}`, { status });
  }

  adminNews(): Observable<NewsPost[]> {
    return this.http.get<NewsPost[]>(`${this.base}/admin/news`, { params: { t: Date.now() } });
  }

  addNews(link: string): Observable<NewsPost> {
    return this.http.post<NewsPost>(`${this.base}/admin/news`, { link });
  }

  deleteNews(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/news/${id}/delete`, {});
  }
}
