export type User = {
  id: string;
  email: string;
  phone?: string | null;
  first_name: string;
  last_name: string;
  role: string;
  preferred_language?: string;
};

export type Category = {
  id: string;
  name: string;
  name_dari: string;
  slug: string;
  parent_id?: string | null;
  image_url?: string;
  display_order?: number;
  status?: string;
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
  barcode?: string | null;
  status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "RECALLED";
  created_at?: string;
  updated_at?: string;
};

export type Manufacturer = {
  id: string;
  name: string;
  name_dari: string;
  country_code: string;
  website: string;
  logo_url: string;
  display_order: number;
  status?: "ACTIVE" | "INACTIVE";
  created_at?: string;
  updated_at?: string;
};

export type DosageForm = {
  id: string;
  code: string;
  name: string;
  name_dari: string;
};

export type CartItem = {
  id: string;
  medicine: Medicine;
  quantity: number;
  unit_price: string | null;
  line_total: string | null;
  available_quantity: number;
  prescription?: string | null;
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
  delivery_instructions?: string;
  latitude?: string | null;
  longitude?: string | null;
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
  prescription_id: string | null;
  prescription_status_snapshot: string;
  prescription_expires_at_snapshot: string | null;
  items: OrderItem[];
  status_history: StatusHistory[];
  placed_at: string;
};

export type PrescriptionHistory = {
  id: number;
  from_status: string;
  to_status: string;
  action: string;
  customer_visible_note: string;
  created_at: string;
};

export type AuthorizedMedicine = {
  id: string;
  medicine_id: string;
  medicine_name: string;
  max_quantity: number;
  instructions: string;
};

export type Prescription = {
  id: string;
  document_url: string;
  original_filename: string;
  patient_name: string;
  contact_phone: string;
  delivery_preference: string;
  customer_note: string;
  status: string;
  customer_visible_note: string;
  clarification_request: string;
  customer_response: string;
  expires_at: string | null;
  review_started_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  can_cancel: boolean;
  can_respond: boolean;
  can_add_to_cart: boolean;
  authorized_medicines: AuthorizedMedicine[];
  history: PrescriptionHistory[];
};

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  title_en: string;
  message_en: string;
  prescription_id: string | null;
  order_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type PublicBanner = {
  id: string;
  code: string;
  placement: "HOME_HERO" | "HOME_SECONDARY" | "CATALOGUE";
  title: string;
  title_dari: string;
  body: string;
  body_dari: string;
  image_url: string | null;
  alt_text: string;
  alt_text_dari: string;
  action_label: string;
  action_label_dari: string;
  action_url: string;
  display_order: number;
  publish_from: string | null;
  publish_until: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicAnnouncement = {
  id: string;
  level: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  placement: "GLOBAL" | "HOME" | "CHECKOUT";
  title: string;
  title_dari: string;
  body: string;
  body_dari: string;
  action_label: string;
  action_label_dari: string;
  action_url: string;
  display_order: number;
  publish_from: string | null;
  publish_until: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicContentPage = {
  id: string;
  content_type: "INFORMATIONAL" | "HEALTH_ARTICLE";
  slug: string;
  title: string;
  title_dari: string;
  summary: string;
  summary_dari: string;
  body: string;
  body_dari: string;
  image_url: string | null;
  alt_text: string;
  alt_text_dari: string;
  author_source: string;
  display_order: number;
  publish_from: string | null;
  publish_until: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicFeaturedMedicine = {
  id: string;
  medicine_id: string;
  medicine_name: string;
  medicine_name_dari: string;
  placement:
    | "HOME_FEATURED"
    | "HOME_RECOMMENDED"
    | "CATALOGUE_FEATURED";
  label: string;
  label_dari: string;
  display_order: number;
  publish_from: string | null;
  publish_until: string | null;
  created_at: string;
  updated_at: string;
};

export type PageResult<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
