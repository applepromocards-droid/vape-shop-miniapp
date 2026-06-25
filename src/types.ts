export interface Flavor {
  id: string;
  name: string;
  inStock: boolean;
}

export interface Category {
  id: string;
  title: string;
  subtitle?: string;
  emoji: string;
  image?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  title: string;
  price: number;
  currency: string;
  emoji: string;
  image?: string;
  puffs?: number;
  badge?: string;
  inStock: boolean;
  flavors?: Flavor[];
}

export interface CartItem {
  product: Product;
  flavor?: Flavor;
  qty: number;
}

export interface Hero {
  visible: boolean;
  tag: string;
  title: string;
  subtitle: string;
  image?: string;
  imagePosition?: { x: number; y: number };
  imageZoom?: number; // percent of container width, default 200
}
