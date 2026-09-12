export type UserRole = 'ADMIN' | 'PHOTOGRAPHE' | 'CLIENT' | 'VISITOR';

export type PhotographerStatus = 'EN_ATTENTE' | 'APPROUVÉ' | 'REFUSÉ' | 'SUSPENDU';

export type EventStatus = 'BROUILLON' | 'ACTIF' | 'ARCHIVÉ' | 'SUSPENDU';

export type EventCategory =
  | 'mariage'
  | 'sport'
  | 'bapteme'
  | 'anniversaire'
  | 'evenement_religieux'
  | 'concert'
  | 'remise_diplome'
  | 'ecole'
  | 'entreprise'
  | 'mode'
  | 'shooting_individuel'
  | 'evenement_public'
  | 'artistique'
  | 'autre';

export type GalleryPrivacy = 'PUBLIC' | 'CODE_PIN' | 'PRIVE';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'tile';
  opacity: number; // 0.1 to 1.0
}

export interface Photo {
  id: string;
  eventId: string;
  galleryId: string;
  title: string;
  filename: string;
  urlOriginal: string; // Private S3 simulation
  urlThumbnail: string; // Fast thumbnail
  urlPreview: string; // Optimized preview
  width: number;
  height: number;
  sizeBytes: number;
  priceCFA: number;
  tags: string[];
  photoNumber: number;
  createdAt: string;
}

export interface Gallery {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  privacy: GalleryPrivacy;
  accessPin?: string;
  photoCount: number;
}

export interface Event {
  id: string;
  slug: string;
  photographerId: string;
  photographerName: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  coverPhotoUrl: string;
  status: EventStatus;
  privacy: GalleryPrivacy;
  accessPin?: string;
  qrCodeUrl?: string;
  viewsCount: number;
  downloadsCount: number;
  photosCount: number;
  galleries: Gallery[];
  watermark: WatermarkConfig;
  defaultPricePerPhotoCFA: number;
  packPriceCFA?: number;
  fullGalleryPriceCFA?: number;
  createdAt: string;
}

export interface PhotographerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  bio: string;
  specialties: EventCategory[];
  portfolioUrl?: string;
  avatarUrl: string;
  status: PhotographerStatus;
  statusHistory: {
    status: PhotographerStatus;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }[];
  subscriptionPlan: 'FREE' | 'PRO' | 'STUDIO';
  storageUsedMB: number;
  storageMaxMB: number;
  walletBalanceCFA: number;
  createdAt: string;
}

export interface OrderItem {
  photoId: string;
  photoTitle: string;
  thumbnailUrl: string;
  priceCFA: number;
  type: 'SINGLE' | 'PACK' | 'FULL_GALLERY';
}

export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'CARTE_BANCAIRE';

export interface Order {
  id: string;
  orderNumber: string;
  eventId: string;
  eventTitle: string;
  photographerId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  items: OrderItem[];
  totalAmountCFA: number;
  platformCommissionCFA: number;
  photographerEarningsCFA: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  accessGrantedUntil: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  details?: string;
}
