export interface ProductImage {
  id: number;
  url: string;
}

export interface Product {
  id: number;
  category_id: number | null;
  code: string;
  name_ka: string;
  name_en: string | null;
  name_ru: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  price: number | null;
  in_stock: boolean;
  is_active: boolean;
  images: ProductImage[];
}

export interface Category {
  id: number;
  name_ka: string;
  name_en: string | null;
  name_ru: string | null;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CartItem {
  productId: number;
  code: string;
  name: string;
  image: string | null;
  quantity: number;
}

export interface OrderRequest {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  comment?: string;
  items: { productId: number; quantity: number }[];
}

export interface Order {
  id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  comment: string | null;
  status: 'new' | 'in_progress' | 'done' | 'cancelled';
  email_sent: boolean;
  created_at: string;
  items: { product_code: string; product_name: string; quantity: number }[];
}

export type Equipment = 'passenger' | 'freight' | 'escalator' | 'other';
export type Issue = 'stopped' | 'stuck' | 'doors' | 'noise' | 'maintenance' | 'modernization' | 'other';

export interface ServiceRequestInput {
  name: string;
  phone: string;
  address: string;
  equipment: Equipment;
  issue: Issue;
  urgent: boolean;
  comment?: string;
  lang?: string;
}

export interface ServiceRequest {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  equipment: Equipment;
  issue: Issue;
  urgent: boolean;
  comment: string | null;
  status: Order['status'];
  email_sent: boolean;
  created_at: string;
}

export type QuoteProduct = 'passenger' | 'freight' | 'panoramic' | 'home' | 'escalator' | 'other';
export type Building = 'residential' | 'house' | 'office' | 'hotel' | 'hospital' | 'mall' | 'industrial' | 'other';
export type Capacity = '400' | '630' | '1000' | '1600' | 'unsure';

export interface QuoteRequestInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  product: QuoteProduct;
  building: Building;
  floors: number | null;
  shaft_width: number | null;
  shaft_depth: number | null;
  pit_depth: number | null;
  last_floor_height: number | null;
  floor_height: number | null;
  comment?: string;
  lang?: string;
}

export interface QuoteRequest {
  id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  city: string | null;
  product: QuoteProduct;
  building: Building;
  floors: number | null;
  /** Only on requests sent before the form asked for shaft sizes instead. */
  capacity: Capacity | null;
  shaft_width: number | null;
  shaft_depth: number | null;
  pit_depth: number | null;
  last_floor_height: number | null;
  floor_height: number | null;
  drawing_name: string | null;
  comment: string | null;
  status: Order['status'];
  email_sent: boolean;
  created_at: string;
}

export interface NewsPost {
  id: number;
  urn: string;
  height: number;
  created_at: string;
}

export interface VisitSummary {
  views: number;
  visitors: number;
}

export interface VisitStats {
  days: number;
  /** False when the server has no country database installed yet. */
  countryLookup: boolean;
  today: VisitSummary;
  week: VisitSummary;
  period: VisitSummary;
  perDay: ({ date: string } & VisitSummary)[];
  countries: ({ country: string | null; name: string } & VisitSummary)[];
  pages: ({ path: string } & VisitSummary)[];
  referrers: { referrer: string; visitors: number }[];
  recent: {
    id: number;
    ip: string;
    country: string | null;
    country_name: string | null;
    path: string;
    referrer: string | null;
    device: 'desktop' | 'mobile' | 'tablet' | null;
    created_at: string;
  }[];
}

export interface Article {
  id: number;
  slug: string;
  title_ka: string;
  title_en: string | null;
  title_ru: string | null;
  summary_ka: string | null;
  summary_en: string | null;
  summary_ru: string | null;
  body_ka?: string | null;
  body_en?: string | null;
  body_ru?: string | null;
  cover_image: string | null;
  author: string | null;
  is_published?: number | boolean;
  created_at: string;
  updated_at: string;
}

export type AssistantAction = 'service' | 'quote' | 'parts' | 'call' | 'contact' | 'lifts' | 'escalators' | 'articles';

export interface AssistantProduct {
  id: number;
  code: string;
  name: string;
  image: string | null;
}

export interface AssistantReply {
  lang: string;
  text: string;
  extraText: string | null;
  products: AssistantProduct[];
  actions: AssistantAction[];
  searchQuery: string | null;
}

export interface AssistantAnswer {
  id: number;
  title: string;
  keywords: string;
  answer_ka: string;
  answer_en: string | null;
  answer_ru: string | null;
  action: AssistantAction | null;
  is_active: boolean;
  sort_order: number;
}

export interface AssistantQuestion {
  id: number;
  message: string;
  lang: string | null;
  answer_id: number | null;
  answer_title: string | null;
  products_found: number;
  answered: boolean;
  created_at: string;
}
