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
