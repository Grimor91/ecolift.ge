import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../shop/api.service';
import { AuthService } from '../shop/auth.service';
import { Article, AssistantAction, AssistantAnswer, AssistantQuestion, Capacity, Category, NewsPost, Order, Product, QuoteRequest, ServiceRequest, VisitStats } from '../shop/models';

type Tab = 'products' | 'orders' | 'service' | 'quotes' | 'news' | 'articles' | 'assistant' | 'visits' | 'categories';

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

const emptyArticle = (): Record<string, any> => ({
  title_ka: '', title_en: '', title_ru: '',
  summary_ka: '', summary_en: '', summary_ru: '',
  body_ka: '', body_en: '', body_ru: '',
  slug: '', author: '', cover_image: '', is_published: true,
});

const emptyAnswer = () => ({
  title: '',
  keywords: '',
  answer_ka: '',
  answer_en: '',
  answer_ru: '',
  action: null as AssistantAction | null,
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
  articles: Article[] = [];
  articleForm = emptyArticle();
  editingArticle: Article | null = null;
  articleLang = 'ka';
  readonly articleLangs = [
    { code: 'ka', label: 'ქართული' },
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ];
  savingArticle = false;
  uploadingArticleImage = false;
  articleMessage = '';
  articleError = '';
  visits: VisitStats | null = null;
  visitDays = 30;

  assistantAnswers: AssistantAnswer[] = [];
  assistantQuestions: AssistantQuestion[] = [];
  onlyUnanswered = true;
  answerForm = emptyAnswer();
  editingAnswer: AssistantAnswer | null = null;
  savingAnswer = false;
  answerMessage = '';
  answerError = '';
  readonly assistantActions: { value: AssistantAction | null; label: string }[] = [
    { value: null, label: 'ღილაკის გარეშე' },
    { value: 'service', label: 'სერვისის განაცხადი' },
    { value: 'quote', label: 'ფასის მოთხოვნა (ახალი ლიფტი)' },
    { value: 'parts', label: 'ნაწილების კატალოგი' },
    { value: 'call', label: 'დარეკვა' },
    { value: 'contact', label: 'WhatsApp' },
    { value: 'lifts', label: 'ლიფტების გვერდი' },
    { value: 'escalators', label: 'ესკალატორების გვერდი' },
    { value: 'articles', label: 'სტატიები' },
  ];

  showPassword = false;
  passwordForm = { current: '', next: '', repeat: '' };
  passwordMessage = '';
  passwordError = '';

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

  readonly deviceLabels: Record<string, string> = { desktop: 'კომპიუტერი', mobile: 'მობილური', tablet: 'პლანშეტი' };

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

  // ---- Password ----

  changePassword(): void {
    const f = this.passwordForm;
    this.passwordMessage = this.passwordError = '';
    if (f.next !== f.repeat) {
      this.passwordError = 'ახალი პაროლები ერთმანეთს არ ემთხვევა';
      return;
    }
    if (f.next.length < 10) {
      this.passwordError = 'ახალი პაროლი მინიმუმ 10 სიმბოლო უნდა იყოს';
      return;
    }
    this.api.changePassword(f.current, f.next).subscribe({
      next: () => {
        this.passwordForm = { current: '', next: '', repeat: '' };
        this.passwordMessage = 'პაროლი შეიცვალა. შემდეგ ჯერზე შედით ახალი პაროლით.';
      },
      error: (err) => (this.passwordError = err.error?.error || 'პაროლი ვერ შეიცვალა'),
    });
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
    this.newsError = '';
    this.api.deleteNews(post.id).subscribe({
      next: () => this.loadNews(),
      error: (err) => (this.newsError = `წაშლა ვერ მოხერხდა (${err.status || 'კავშირი'}). სცადეთ გასვლა და თავიდან შესვლა.`),
    });
  }

  linkedInUrl(post: NewsPost): string {
    return `https://www.linkedin.com/feed/update/${post.urn}/`;
  }

  // ---- Articles ----

  loadArticles(): void {
    this.api.adminArticles().subscribe((a) => (this.articles = a));
  }

  editArticle(a: Article): void {
    this.editingArticle = a;
    const form = emptyArticle();
    for (const key of Object.keys(form)) {
      const value = (a as any)[key];
      form[key] = key === 'is_published' ? !!value : value ?? '';
    }
    this.articleForm = form;
    this.articleLang = 'ka';
    this.articleMessage = this.articleError = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetArticleForm(): void {
    this.editingArticle = null;
    this.articleForm = emptyArticle();
  }

  saveArticle(): void {
    this.articleMessage = this.articleError = '';
    if (!this.articleForm['title_ka'].trim()) {
      this.articleError = 'შეავსეთ სათაური ქართულად';
      this.articleLang = 'ka';
      return;
    }
    this.savingArticle = true;
    const wasEditing = !!this.editingArticle;
    this.api.saveArticle(this.articleForm, this.editingArticle?.id).subscribe({
      next: () => {
        this.savingArticle = false;
        this.articleMessage = wasEditing ? 'სტატია განახლდა' : 'სტატია დაემატა';
        this.resetArticleForm();
        this.loadArticles();
      },
      error: (err) => {
        this.savingArticle = false;
        this.articleError = err.error?.error || 'შენახვა ვერ მოხერხდა';
      },
    });
  }

  // ---- Assistant ----

  loadAssistant(): void {
    this.api.adminAssistantAnswers().subscribe((a) => (this.assistantAnswers = a));
    this.loadAssistantQuestions();
  }

  loadAssistantQuestions(): void {
    this.api.adminAssistantQuestions(this.onlyUnanswered).subscribe((q) => (this.assistantQuestions = q));
  }

  actionLabel(action: AssistantAction | null): string {
    return this.assistantActions.find((a) => a.value === action)?.label || '';
  }

  editAnswer(a: AssistantAnswer): void {
    this.editingAnswer = a;
    this.answerMessage = this.answerError = '';
    this.answerForm = {
      title: a.title,
      keywords: a.keywords,
      answer_ka: a.answer_ka,
      answer_en: a.answer_en || '',
      answer_ru: a.answer_ru || '',
      action: a.action,
      is_active: a.is_active,
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Starts a new answer from a question the assistant could not answer. */
  answerQuestion(q: AssistantQuestion): void {
    this.resetAnswerForm();
    this.answerForm.title = q.message.slice(0, 190);
    this.answerForm.keywords = q.message;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetAnswerForm(): void {
    this.editingAnswer = null;
    this.answerForm = emptyAnswer();
  }

  saveAnswer(): void {
    this.answerMessage = this.answerError = '';
    const f = this.answerForm;
    if (!f.title.trim() || !f.keywords.trim() || !f.answer_ka.trim()) {
      this.answerError = 'შეავსეთ სათაური, საკვანძო სიტყვები და ქართული პასუხი';
      return;
    }
    this.savingAnswer = true;
    const wasEditing = !!this.editingAnswer;
    this.api.saveAssistantAnswer(f, this.editingAnswer?.id).subscribe({
      next: () => {
        this.savingAnswer = false;
        this.answerMessage = wasEditing ? 'პასუხი განახლდა' : 'პასუხი დაემატა';
        this.resetAnswerForm();
        this.loadAssistant();
      },
      error: (err) => {
        this.savingAnswer = false;
        this.answerError = err.error?.error || 'შენახვა ვერ მოხერხდა';
      },
    });
  }

  deleteAnswer(a: AssistantAnswer): void {
    if (!confirm(`წავშალო პასუხი "${a.title}"?`)) return;
    this.api.deleteAssistantAnswer(a.id).subscribe(() => {
      if (this.editingAnswer?.id === a.id) this.resetAnswerForm();
      this.loadAssistant();
    });
  }

  deleteArticle(a: Article): void {
    if (!confirm(`წავშალო სტატია "${a.title_ka}"?`)) return;
    this.api.deleteArticle(a.id).subscribe(() => {
      if (this.editingArticle?.id === a.id) this.resetArticleForm();
      this.loadArticles();
    });
  }

  uploadArticleCover(event: Event): void {
    this.uploadArticleFile(event, (file) => (this.articleForm['cover_image'] = file));
  }

  /** Uploads a photo and writes it into the text where the cursor is. */
  insertArticleImage(event: Event, area: HTMLTextAreaElement): void {
    const key = 'body_' + this.articleLang;
    const at = area.selectionStart ?? area.value.length;
    this.uploadArticleFile(event, (file) => {
      const text: string = this.articleForm[key] || '';
      const snippet = `\n\n![ფოტოს აღწერა](uploads/${file})\n\n`;
      this.articleForm[key] = text.slice(0, at) + snippet + text.slice(at);
    });
  }

  private uploadArticleFile(event: Event, done: (file: string) => void): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadingArticleImage = true;
    this.articleError = '';
    this.api.uploadArticleImage(file).subscribe({
      next: (r) => {
        this.uploadingArticleImage = false;
        done(r.file);
      },
      error: (err) => {
        this.uploadingArticleImage = false;
        this.articleError = err.error?.error === 'file too large' ? 'ფოტო ძალიან დიდია (მაქს. 5 მბ)' : 'ფოტო ვერ აიტვირთა';
      },
    });
  }

  // ---- Visitors ----

  loadVisits(): void {
    this.api.adminVisits(this.visitDays).subscribe((v) => (this.visits = v));
  }

  get busiestDay(): number {
    return Math.max(1, ...(this.visits?.perDay.map((d) => d.views) || []));
  }

  /** Flag picture (Windows does not draw flag emoji). */
  flag(country: string): string {
    return `https://flagcdn.com/20x15/${country.toLowerCase()}.png`;
  }
}
