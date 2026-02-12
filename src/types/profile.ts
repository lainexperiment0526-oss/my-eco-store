// Shared types for consistent interface across components

export type LinkCategory = 'suggested' | 'commerce' | 'social' | 'media' | 'contact' | 'events' | 'text';
export type DisplayStyle = 'classic' | 'featured' | 'animated';
export type LayoutType = 'stack' | 'grid' | 'carousel' | 'showcase';
export type AnimationType = 'none' | 'bounce' | 'pulse' | 'glow';

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  favicon?: string;
  image?: string;
  color?: string;
  textColor?: string;
  category?: LinkCategory;
  isVisible?: boolean;
  priority?: number;
  displayStyle?: DisplayStyle;
  customStyling?: {
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: number;
    padding?: number;
    animation?: AnimationType;
  };
}

export interface SocialLink {
  type?: string; // e.g. 'twitter', 'instagram', etc. (deprecated in favor of platform)
  platform?: string; // normalized platform name
  url: string;
  icon?: string; // icon name or url
  label?: string; // custom label
  followers?: number; // user-entered follower count
  verified_followers?: number; // API-verified follower count
  last_verified?: string; // ISO timestamp of last verification
  is_verified?: boolean; // whether follower count is verified
}

export type SocialLinks = SocialLink[];

export interface ThemeData {
  primaryColor: string;
  backgroundColor: string;
  backgroundType: 'color' | 'gif' | 'video';
  backgroundGif: string;
  backgroundVideo?: string;
  iconStyle: string;
  buttonStyle: string;
  textColor?: string;
  glassMode?: boolean;
  coverImage?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  quantity?: number;
  details?: string;
  file_url?: string;
}

export interface CartItem extends ProductItem {
  cartQuantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paymentLink?: string;
}

export interface PaymentLink {
  id: string;
  amount: number;
  description: string;
  type: 'product' | 'donation' | 'tip' | 'subscription' | 'group';
  url: string;
  created: Date;
  active: boolean;
  totalReceived: number;
  transactionCount: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number | string;
  fileUrl: string;
}

export interface ShortenedLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  clicks: number;
  qrCode?: string;
  created: Date;
  active: boolean;
}

export interface Wallets {
  crypto: { id: string; address: string; name: string }[];
  bank: { id: string; accountNumber: string; bankName: string; details: string }[];
}

export interface ImageLinkCard {
  id: string;
  imageUrl: string;
  linkUrl: string;
  title: string;
}

export interface AppLinkItem {
  id: string;
  title: string;
  url: string;
  logo?: string;
  description?: string;
}

export interface SocialEmbedItem {
  id: string;
  platform?: string;
  url?: string;
  embedHtml?: string;
  title?: string;
  pinned?: boolean;
  thumbnail?: string;
}

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  logo?: string;
  businessName?: string;
  appLink?: string;
  appTitle?: string;
  appLogo?: string;
  appDescription?: string;
  appLinks?: AppLinkItem[];
  description?: string;
  youtubeVideoUrl?: string;
  backgroundMusicUrl?: string;
  category?: string;
  customLinks?: CustomLink[];
  products?: Product[];
  imageLinkCards?: ImageLinkCard[];
  socialFeedItems?: SocialEmbedItem[];
  theme?: ThemeData;
  wallets?: Wallets;
  hasPremium?: boolean;
  piWalletAddress?: string;
  piDonationMessage?: string;
  showShareButton?: boolean;
  storeUrl?: string;
  showPiWalletTips?: boolean;
  socialLinks?: SocialLinks;
  paymentLinks?: PaymentLink[];
  shortenedLinks?: ShortenedLink[];
  linkLayoutType?: string;
  piWalletQrUrl?: string;
  card_front_color?: string;
  card_back_color?: string;
  card_text_color?: string;
  card_accent_color?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  customDomain?: string;
}
