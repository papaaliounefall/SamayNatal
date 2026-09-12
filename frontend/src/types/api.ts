// Shapes returned by the real Django API (after snake_case -> camelCase
// conversion in lib/api.ts). Distinct from the old mock-only types in
// types/index.ts, which this file is gradually replacing.

export type UserRole = 'ADMIN' | 'PHOTOGRAPHE' | 'CLIENT';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  dateJoined: string;
  photographerStatus: PhotographerStatus | null;
}

export type PhotographerStatus = 'EN_ATTENTE' | 'APPROUVÉ' | 'REFUSÉ' | 'SUSPENDU';
export type SubscriptionPlanCode = 'FREE' | 'PRO' | 'STUDIO';

export interface PhotographerStatusChange {
  status: PhotographerStatus;
  changedByLabel: string;
  reason: string;
  changedAt: string;
}

export interface PhotographerProfile {
  id: string;
  email: string;
  businessName: string;
  city: string;
  country: string;
  bio: string;
  specialties: string[];
  portfolioUrl: string;
  avatarUrl: string;
  socialLinks: Record<string, string>;
  status: PhotographerStatus;
  subscriptionPlan: SubscriptionPlanCode;
  storageUsedMb: number;
  storageMaxMb: number;
  walletBalanceCfa: number;
  statusHistory: PhotographerStatusChange[];
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  entryType: 'SALE_CREDIT' | 'COMMISSION_DEBIT' | 'PAYOUT' | 'ADJUSTMENT';
  amountCfa: number;
  balanceAfterCfa: number;
  reference: string;
  note: string;
  createdAt: string;
}

export interface Wallet {
  balanceCfa: number;
  updatedAt: string;
  entries: LedgerEntry[];
}

export type GalleryPrivacy = 'PUBLIC' | 'CODE_PIN' | 'PRIVE';
export type EventStatus = 'BROUILLON' | 'ACTIF' | 'ARCHIVÉ' | 'SUSPENDU';
export type WatermarkPosition = 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'tile';

export type EventCategory =
  | 'mariage' | 'sport' | 'bapteme' | 'anniversaire' | 'evenement_religieux' | 'concert'
  | 'remise_diplome' | 'ecole' | 'entreprise' | 'mode' | 'shooting_individuel'
  | 'evenement_public' | 'artistique' | 'autre';

export interface Gallery {
  id: string;
  event: string;
  name: string;
  description: string;
  isDefault: boolean;
  privacy: GalleryPrivacy;
  photoCount: number;
  sortOrder: number;
  hasPin: boolean;
  createdAt: string;
}

export interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  coverPhotoUrl: string;
  status: EventStatus;
  privacy: GalleryPrivacy;
  hasPin: boolean;
  viewsCount: number;
  downloadsCount: number;
  photosCount: number;
  defaultPricePerPhotoCfa: number;
  packPriceCfa: number | null;
  fullGalleryPriceCfa: number | null;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkPosition: WatermarkPosition;
  watermarkOpacity: number;
  galleries: Gallery[];
  publicUrl: string;
  createdAt: string;
}

export interface PublicGallery {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  photoCount: number;
}

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: EventCategory;
  coverPhotoUrl: string;
  photographerName: string;
  photosCount: number;
  privacy: GalleryPrivacy;
  requiresPin: boolean;
  defaultPricePerPhotoCfa: number;
  packPriceCfa: number | null;
  fullGalleryPriceCfa: number | null;
  galleries: PublicGallery[];
  unlocked: boolean;
}

export type PhotoStatus = 'PROCESSING' | 'READY' | 'FAILED' | 'QUARANTINED';

export interface Photo {
  id: string;
  event: string;
  gallery: string;
  title: string;
  originalFilename: string;
  originalUrl: string | null;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  watermarkedUrl: string | null;
  width: number;
  height: number;
  sizeBytes: number;
  priceCfa: number;
  tags: string[];
  photoNumber: number;
  status: PhotoStatus;
  createdAt: string;
}

export interface PublicPhoto {
  id: string;
  photoNumber: number;
  thumbnailUrl: string | null;
  displayUrl: string | null;
  priceCfa: number;
  tags: string[];
  hdAvailable: boolean;
}

export type OrderItemType = 'SINGLE' | 'PACK' | 'FULL_GALLERY';
export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'CARTE_BANCAIRE';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  photo: string | null;
  itemType: OrderItemType;
  titleSnapshot: string;
  priceCfa: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  event: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  items: OrderItem[];
  totalAmountCfa: number;
  platformCommissionCfa: number;
  photographerEarningsCfa: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  accessGrantedUntil: string | null;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  code: SubscriptionPlanCode;
  name: string;
  priceCfaPerMonth: number;
  storageLimitMb: number;
  maxActiveEvents: number | null;
  features: string[];
}

export interface AuditLogEntry {
  id: string;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: string;
  createdAt: string;
}

export interface PlatformSettingsData {
  commissionRate: number;
  updatedAt: string;
}

export interface Paginated<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}
