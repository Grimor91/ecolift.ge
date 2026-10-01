import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../shop/api.service';
import { AuthService } from '../shop/auth.service';
import { Capacity, Category, NewsPost, Order, Product, QuoteRequest, ServiceRequest } from '../shop/models';

type Tab = 'products' | 'orders' | 'service' | 'quotes' | 'news' | 'categories';

const emptyForm = () => ({
  code: '',
  category_id: null as number | null,
  name_ka: '',
  name_en: '',
  name_ru: '',
  description_ka: '',
  description_en: '',
  description_ru: '',
  price: null as number | null,
  in_stock: true,
  is_active: true,
});

@Component({
  selector: 'app-adminpanel',
  templateUrl: './adminpanel.component.html',
  styleUrls: ['./adminpanel.component.css'],
})
export class AdminpanelComponent implements OnInit, OnDestroy {
  tab: Tab = 'products';

  products: Product[] = [];
  categories: Category[] = [];
  orders: Order[] = [];
  serviceRequests: ServiceRequest[] = [];
  quoteRequests: QuoteRequest[] = [];
  news: NewsPost[] = [];
  newsLink = '';
  newsError = '';

  form = emptyForm();
  editing: Product | null = null;
  newFiles: { file: File; preview: string }[] = [];
  saving = false;
  message = '';
  error = '';

  newCategory = { name_ka: '', name_en: '', name_ru: '' };

  readonly statuses: { value: Order['status']; label: string }[] = [
    { value: 'new', label: 'ახალი' },
    { value: 'in_progress', label: 'მუშავდება' },
    { value: 'done', label: 'შესრულებული' },
    { value: 'cancelled', label: 'გაუქმებული' },
  ];

  readonly equipmentLabels: Record<ServiceRequest['equipment'], string> = {
    passenger: 'სამგზავრო ლიფტი',
    freight: 'სატვირთო ლიფტი',
    escalator: 'ესკალატორი',
    other: 'სხვა',
  };

  readonly issueLabels: Record<ServiceRequest['issue'], string> = {
    stopped: 'ლიფტი გაჩერდა',
    stuck: 'ადამიანი გაიჭედა',
    doors: 'კარების პრობლემა',
    noise: 'ხმაური ან ვიბრაცია',
    maintenance: 'გეგმიური მომსახურება',
    modernization: 'მოდერნიზაცია',
    other: 'სხვა',
  };

  readonly productLabels: Record<QuoteRequest['product'], string> = {
    passenger: 'სამგზავრო ლიფტი',
    freight: 'სატვირთო ლიფტი',
    panoramic: 'პანორამული ლიფტი',
    home: 'სახლის ლიფტი',
    escalator: 'ესკალატორი',
    other: 'სხვა',
  };

  readonly buildingLabels: Record<QuoteRequest['building'], string> = {
    residential: 'საცხოვრებელი კორპუსი',
    house: 'კერძო სახლი',
    office: 'ოფისი ან ბიზნეს ცენტრი',
    hotel: 'სასტუმრო',
    hospital: 'საავადმყოფო',
    mall: 'სავაჭრო ცენტრი',
    industrial: 'საწარმო ან საწყობი',
    other: 'სხვა',
  };

  readonly capacityLabels: Record<Capacity, string> = {
    '400': '400 კგ',
    '630': '630 კგ',
    '1000': '1000 კგ',
    '1600': '1600+ კგ',
    unsure: 'ტვირთამწეობა უცნობია',
  };

  constructor(public api: ApiService, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadOrders();
    this.loadServiceRequests();
    this.loadQuoteRequests();
  }

  ngOnDestroy(): void {
    this.clearNewFiles();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }

  // ---- Products ----

  loadProducts(): void {
    this.api.adminProducts().subscribe((p) => (this.products = p));
  }

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    for (const file of Array.from(input.files || [])) {
      this.newFiles.push({ file, preview: URL.createObjectURL(file) });
    }
    input.value = '';
  }

  removeNewFile(index: number): void {
    URL.revokeObjectURL(this.newFiles[index].preview);
    this.newFiles.splice(index, 1);
  }

  edit(p: Product): void {
    this.editing = p;
    this.form = {
      code: p.code,
      category_id: p.category_id,
      name_ka: p.name_ka,
      name_en: p.name_en || '',
      name_ru: p.name_ru || '',
      description_ka: p.description_ka || '',
      description_en: p.description_en || '',
      description_ru: p.description_ru || '',
      price: p.price,
      in_stock: p.in_stock,
      is_active: p.is_active,
    };
    this.clearNewFiles();
    this.message = this.error = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(): void {
    this.editing = null;
    this.form = emptyForm();
    this.clearNewFiles();
  }

  save(): void {
    const data = new FormData();
    for (const [key, value] of Object.entries(this.form)) {
      data.append(key, value === null || value === undefined ? '' : String(value));
    }
    this.newFiles.forEach((f) => data.append('images', f.file));

    this.saving = true;
    this.message = this.error = '';
    this.api.saveProduct(data, this.editing?.id).subscribe({
      next: () => {
        this.message = this.editing ? 'პროდუქტი განახლდა' : 'პროდუქტი დაემატა';
        this.saving = false;
        this.resetForm();
        this.loadProducts();
      },
      error: (err) => {
        this.error = err.error?.error || 'შენახვა ვერ მოხერხდა';
        this.saving = false;
      },
    });
  }

  deleteImage(imageId: number): void {
    if (!this.editing || !confirm('სურათის წაშლა?')) return;
    const product = this.editing;
    this.api.deleteImage(product.id, imageId).subscribe(() => {
      product.images = product.images.filter((i) => i.id !== imageId);
    });
  }

  deleteProduct(p: Product): void {
    if (!confirm(`წავშალო "${p.name_ka}"?`)) return;
    this.api.deleteProduct(p.id).subscribe(() => {
      if (this.editing?.id === p.id) this.resetForm();
      this.loadProducts();
    });
  }

  categoryName(id: number | null): string {
    return this.categories.find((c) => c.id === id)?.name_ka || '-';
  }

  private clearNewFiles(): void {
    this.newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    this.newFiles = [];
  }

  // ---- Categories ----

  loadCategories(): void {
    this.api.getCategories().subscribe((c) => (this.categories = c));
  }

  addCategory(): void {
    const c = this.newCategory;
    if (!c.name_ka.trim()) return;
    this.api.addCategory(c.name_ka, c.name_en, c.name_ru).subscribe(() => {
      this.newCategory = { name_ka: '', name_en: '', name_ru: '' };
      this.loadCategories();
    });
  }

  deleteCategory(c: Category): void {
    if (!confirm(`წავშალო კატეგორია "${c.name_ka}"? პროდუქტები დარჩება კატეგორიის გარეშე.`)) return;
    this.api.deleteCategory(c.id).subscribe(() => this.loadCategories());
  }

  // ---- Orders ----

  loadOrders(): void {
    this.api.adminOrders().subscribe((o) => (this.orders = o));
  }

  get newOrdersCount(): number {
    return this.orders.filter((o) => o.status === 'new').length;
  }

  setStatus(order: Order, status: Order['status']): void {
    this.api.setOrderStatus(order.id, status).subscribe(() => (order.status = status));
  }

  // ---- Service requests ----

  loadServiceRequests(): void {
    this.api.adminServiceRequests().subscribe((r) => (this.serviceRequests = r));
  }

  get newServiceCount(): number {
    return this.serviceRequests.filter((r) => r.status === 'new').length;
  }

  setServiceStatus(request: ServiceRequest, status: ServiceRequest['status']): void {
    this.api.setServiceRequestStatus(request.id, status).subscribe(() => (request.status = status));
  }

  // ---- Quote requests ----

  loadQuoteRequests(): void {
    this.api.adminQuoteRequests().subscribe((r) => (this.quoteRequests = r));
  }

  get newQuoteCount(): number {
    return this.quoteRequests.filter((r) => r.status === 'new').length;
  }

  hasSizes(r: QuoteRequest): boolean {
    return !!(r.shaft_width || r.shaft_depth || r.pit_depth || r.last_floor_height || r.floor_height);
  }

  mm(value: number | null): string {
    return value ? `${value} მმ` : '-';
  }

  downloadDrawing(r: QuoteRequest): void {
    this.api.quoteDrawing(r.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = r.drawing_name || 'drawing';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  setQuoteStatus(request: QuoteRequest, status: QuoteRequest['status']): void {
    this.api.setQuoteRequestStatus(request.id, status).subscribe(() => (request.status = status));
  }

  // ---- News (LinkedIn posts) ----

  loadNews(): void {
    this.api.adminNews().subscribe((n) => (this.news = n));
  }

  addNews(): void {
    if (!this.newsLink.trim()) return;
    this.newsError = '';
    this.api.addNews(this.newsLink).subscribe({
      next: () => {
        this.newsLink = '';
        this.loadNews();
      },
      error: (err) => (this.newsError = err.error?.error || 'დამატება ვერ მოხერხდა'),
    });
  }

  deleteNews(post: NewsPost): void {
    if (!confirm('წავშალო ეს სიახლე საიტიდან? LinkedIn-ზე პოსტი დარჩება.')) return;
    this.api.deleteNews(post.id).subscribe(() => this.loadNews());
  }

  linkedInUrl(post: NewsPost): string {
    return `https://www.linkedin.com/feed/update/${post.urn}/`;
  }
}
