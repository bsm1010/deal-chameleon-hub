export interface Profile {
  id: string;
  full_name: string;
  role: "customer" | "owner";
  created_at: string;
}

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string;
  wilaya: string;
  commune: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  cover_photo: string | null;
  logo: string | null;
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  reviews_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  order_index: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  photo: string | null;
  is_available: boolean;
  order_index: number;
}

export interface Review {
  id: string;
  restaurant_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  owner_name: string;
  reply: string;
  created_at: string;
}

export interface MenuView {
  id: string;
  restaurant_id: string;
  item_id: string | null;
  category_id: string | null;
  viewed_at: string;
}

export interface MapClick {
  id: string;
  restaurant_id: string;
  clicked_at: string;
}

export interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

export const EMPTY_HOURS: DayHours = { open: false, from: "09:00", to: "22:00" };

export const DAYS_AR = [
  { key: "sat", label: "السبت" },
  { key: "sun", label: "الأحد" },
  { key: "mon", label: "الاثنين" },
  { key: "tue", label: "الثلاثاء" },
  { key: "wed", label: "الأربعاء" },
  { key: "thu", label: "الخميس" },
  { key: "fri", label: "الجمعة" },
] as const;

export const CATEGORIES = [
  "فاست فود",
  "مشاوي",
  "بيتزا",
  "كافيه",
  "مطعم عائلي",
  "حلويات",
  "سوشي",
  "برغر",
] as const;

export const WILAYAS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار",
  "البليدة","البويرة","تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر",
  "الجلفة","جيجل","سطيف","سعيدة","سكيكدة","سيدي بلعباس","عنابة","قالمة",
  "قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة","وهران","البيض",
  "إليزي","برج بوعريريج","بومرداس","الشريعة","تيبازة","تيسمسيلت","الوادي",
  "خنشلة","سوق أهراس","تازة","جانت","المغير","النعامة","عين تموشنت",
  "غرداية","غليزان","تمنراست","برج باجي مختار","أولاد جلال","بني عباس",
  "عين صالح","عين قزام","توقرت","جانت","المغير","النعامة",
] as const;

export const CITIES = [
  "الجزائر","وران","قسنطينة","عنابة","سطيف","البليدة","بجاية","بسكرة",
  "تيزي وزو","بومرداس","المدية","بشار","تلمسان","معسكر","وهران",
] as const;
