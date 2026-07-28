export type User = {
  id: string;
  email: string;
  phone?: string | null;
  first_name: string;
  last_name: string;
  role: string;
};

export type Category = {
  id: string;
  name: string;
  name_dari: string;
  slug: string;
};

export type Medicine = {
  id: string;
  sku: string;
  brand_name: string;
  brand_name_dari: string;
  generic_name: string;
  manufacturer: { id: string; name: string } | null;
  category: Category | null;
  dosage_form: { id: string; code: string; name: string; name_dari: string };
  strength: string;
  pack_size: string;
  description: string;
  description_dari: string;
  prescription_required: boolean;
  image_url: string;
  images: {
    id: string;
    medicine_id: string;
    image_url: string;
    alt_text: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
  }[];
  price: string | null;
  available_quantity: number;
  in_stock: boolean;
};

export type CartItem = {
  id: string;
  medicine: Medicine;
  quantity: number;
  unit_price: string | null;
  line_total: string | null;
  available_quantity: number;
};

export type Cart = {
  id: string;
  branch_id: string;
  items: CartItem[];
  item_count: number;
  subtotal: string;
};

export type Address = {
  id: string;
  label: string;
  recipient_name: string;
  recipient_phone: string;
  country_code: string;
  province: string;
  city: string;
  district: string;
  street_address: string;
  landmark: string;
  is_default: boolean;
};

export type OrderItem = {
  id: string;
  medicine_id: string | null;
  medicine_name: string;
  strength: string;
  dosage_form: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type StatusHistory = {
  id: number;
  from_status: string;
  to_status: string;
  note: string;
  created_at: string;
};

export type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  currency_code: string;
  subtotal: string;
  delivery_fee: string;
  discount_total: string;
  grand_total: string;
  delivery_address: Record<string, string>;
  items: OrderItem[];
  status_history: StatusHistory[];
  placed_at: string;
};

export type PageResult<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
