import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  PhotographerProfile,
  Event,
  Photo,
  Order,
  AuditLog,
  WatermarkConfig,
  OrderItem,
} from '../types';
import {
  INITIAL_PHOTOGRAPHER,
  PENDING_PHOTOGRAPHERS,
  INITIAL_EVENTS,
  INITIAL_PHOTOS,
  INITIAL_ORDERS,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';

interface NavigationState {
  view:
    | 'landing'
    | 'photographer_dashboard'
    | 'photographer_event_detail'
    | 'photographer_events_list'
    | 'photographer_wallet'
    | 'photographer_settings'
    | 'client_gallery'
    | 'admin_dashboard'
    | 'register_photographer';
  eventId?: string;
  gallerySlug?: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  navigation: NavigationState;
  navigateTo: (view: NavigationState['view'], options?: { eventId?: string; gallerySlug?: string }) => void;
  photographer: PhotographerProfile;
  pendingPhotographers: PhotographerProfile[];
  allPhotographers: PhotographerProfile[];
  photographers: PhotographerProfile[];
  platformCommissionRate: number;
  setPlatformCommissionRate: (rate: number) => void;
  updatePhotographerStatus: (id: string, status: import('../types').PhotographerStatus, reason?: string) => void;
  events: Event[];
  photos: Photo[];
  orders: Order[];
  auditLogs: AuditLog[];
  cart: OrderItem[];
  unlockedEvents: Record<string, boolean>; // eventId -> boolean

  // Actions
  registerPhotographer: (data: Omit<PhotographerProfile, 'id' | 'userId' | 'status' | 'statusHistory' | 'storageUsedMB' | 'storageMaxMB' | 'walletBalanceCFA' | 'createdAt'>) => void;
  adminApprovePhotographer: (id: string, reason?: string) => void;
  adminRejectPhotographer: (id: string, reason?: string) => void;
  adminSuspendPhotographer: (id: string, reason?: string) => void;
  createEvent: (data: Partial<Event>) => Event;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  addPhotosToGallery: (eventId: string, galleryId: string, newPhotos: Partial<Photo>[]) => void;
  updateEventWatermark: (eventId: string, watermark: WatermarkConfig) => void;
  unlockEvent: (eventId: string, pin: string) => boolean;
  addToCart: (photo: Photo, type?: 'SINGLE' | 'PACK') => void;
  removeFromCart: (photoId: string) => void;
  clearCart: () => void;
  processCheckout: (
    client: { name: string; email: string; phone: string },
    paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'CARTE_BANCAIRE'
  ) => Order;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'lumira_saas_photo_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize or load from local storage
  const [role, setRoleState] = useState<UserRole>('VISITOR');
  const [navigation, setNavigation] = useState<NavigationState>({ view: 'landing' });
  const [photographer, setPhotographer] = useState<PhotographerProfile>(INITIAL_PHOTOGRAPHER);
  const [pendingPhotographers, setPendingPhotographers] = useState<PhotographerProfile[]>(PENDING_PHOTOGRAPHERS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [unlockedEvents, setUnlockedEvents] = useState<Record<string, boolean>>({});
  const [platformCommissionRate, setPlatformCommissionRate] = useState<number>(0.15);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.photographer) setPhotographer(parsed.photographer);
        if (parsed.pendingPhotographers) setPendingPhotographers(parsed.pendingPhotographers);
        if (parsed.events) setEvents(parsed.events);
        if (parsed.photos) setPhotos(parsed.photos);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
  }, []);

  // Save changes to localStorage
  const persistState = (
    newPhotographer = photographer,
    newPending = pendingPhotographers,
    newEvents = events,
    newPhotos = photos,
    newOrders = orders,
    newAuditLogs = auditLogs
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          photographer: newPhotographer,
          pendingPhotographers: newPending,
          events: newEvents,
          photos: newPhotos,
          orders: newOrders,
          auditLogs: newAuditLogs,
        })
      );
    } catch (e) {
      console.error('Error persisting state:', e);
    }
  };

  const navigateTo = (view: NavigationState['view'], options?: { eventId?: string; gallerySlug?: string }) => {
    setNavigation({
      view,
      eventId: options?.eventId,
      gallerySlug: options?.gallerySlug,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'VISITOR') {
      navigateTo('landing');
    } else if (newRole === 'PHOTOGRAPHE') {
      navigateTo('photographer_dashboard');
    } else if (newRole === 'ADMIN') {
      navigateTo('admin_dashboard');
    } else if (newRole === 'CLIENT') {
      // Default to the first active event (Mariage Fatou & Abdou)
      navigateTo('client_gallery', { eventId: events[0]?.id || 'evt-fatou-abdou' });
    }
  };

  // Register a new photographer
  const registerPhotographer = (data: Omit<PhotographerProfile, 'id' | 'userId' | 'status' | 'statusHistory' | 'storageUsedMB' | 'storageMaxMB' | 'walletBalanceCFA' | 'createdAt'>) => {
    const newId = `photog-${Date.now()}`;
    const newProfile: PhotographerProfile = {
      ...data,
      id: newId,
      userId: `user-${Date.now()}`,
      status: 'EN_ATTENTE',
      statusHistory: [
        {
          status: 'EN_ATTENTE',
          changedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          changedBy: 'Système (Candidature en ligne)',
          reason: 'Dossier photographe soumis pour examen',
        },
      ],
      storageUsedMB: 0,
      storageMaxMB: data.subscriptionPlan === 'STUDIO' ? 500000 : data.subscriptionPlan === 'PRO' ? 100000 : 5000,
      walletBalanceCFA: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const newPending = [newProfile, ...pendingPhotographers];
    const newLogs: AuditLog[] = [
      {
        id: `log-${Date.now()}`,
        actor: `${data.firstName} ${data.lastName}`,
        role: 'CANDIDAT',
        action: 'INSCRIPTION_SOUMISE',
        target: `${data.businessName} (${data.city}, ${data.country})`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: 'Dossier photographe envoyé à l’administrateur pour revue.',
      },
      ...auditLogs,
    ];

    setPendingPhotographers(newPending);
    setAuditLogs(newLogs);
    persistState(photographer, newPending, events, photos, orders, newLogs);
  };

  // Admin approves photographer
  const adminApprovePhotographer = (id: string, reason = 'Validation manuelle après vérification du portfolio') => {
    const candidate = pendingPhotographers.find((p) => p.id === id);
    if (!candidate) return;

    const updatedProfile: PhotographerProfile = {
      ...candidate,
      status: 'APPROUVÉ',
      statusHistory: [
        ...candidate.statusHistory,
        {
          status: 'APPROUVÉ',
          changedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          changedBy: 'Admin Principal',
          reason,
        },
      ],
    };

    const newPending = pendingPhotographers.filter((p) => p.id !== id);
    const newLogs: AuditLog[] = [
      {
        id: `log-${Date.now()}`,
        actor: 'Admin Principal',
        role: 'ADMIN',
        action: 'VALIDATION_PHOTOGRAPHE',
        target: `${candidate.businessName} (ID: ${candidate.id})`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: reason,
      },
      ...auditLogs,
    ];

    setPendingPhotographers(newPending);
    // If it's the currently viewed demo photographer, update it
    if (photographer.id === id) {
      setPhotographer(updatedProfile);
    }
    setAuditLogs(newLogs);
    persistState(photographer.id === id ? updatedProfile : photographer, newPending, events, photos, orders, newLogs);
  };

  // Admin rejects photographer
  const adminRejectPhotographer = (id: string, reason = 'Portfolio insuffisant ou non conforme aux critères de qualité') => {
    const candidate = pendingPhotographers.find((p) => p.id === id);
    if (!candidate) return;

    const newPending = pendingPhotographers.filter((p) => p.id !== id);
    const newLogs: AuditLog[] = [
      {
        id: `log-${Date.now()}`,
        actor: 'Admin Principal',
        role: 'ADMIN',
        action: 'REFUS_PHOTOGRAPHE',
        target: `${candidate.businessName} (${candidate.id})`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: reason,
      },
      ...auditLogs,
    ];

    setPendingPhotographers(newPending);
    setAuditLogs(newLogs);
    persistState(photographer, newPending, events, photos, orders, newLogs);
  };

  // Admin suspends photographer
  const adminSuspendPhotographer = (id: string, reason = 'Suspension administrative préventive') => {
    const updatedPhotog: PhotographerProfile = {
      ...photographer,
      status: 'SUSPENDU',
      statusHistory: [
        ...photographer.statusHistory,
        {
          status: 'SUSPENDU',
          changedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          changedBy: 'Admin Principal',
          reason,
        },
      ],
    };

    const newLogs: AuditLog[] = [
      {
        id: `log-${Date.now()}`,
        actor: 'Admin Principal',
        role: 'ADMIN',
        action: 'SUSPENSION_PHOTOGRAPHE',
        target: `${photographer.businessName} (${photographer.id})`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: reason,
      },
      ...auditLogs,
    ];

    setPhotographer(updatedPhotog);
    setAuditLogs(newLogs);
    persistState(updatedPhotog, pendingPhotographers, events, photos, orders, newLogs);
  };

  // Create an event
  const createEvent = (data: Partial<Event>): Event => {
    const newId = `evt-${Date.now()}`;
    const slug = data.title
      ? data.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
      : `evenement-${newId}`;

    const defaultGalleryId = `gal-${Date.now()}-1`;
    const newEvent: Event = {
      id: newId,
      slug,
      photographerId: photographer.id,
      photographerName: photographer.businessName,
      title: data.title || 'Nouvel Événement',
      description: data.description || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      location: data.location || 'Dakar, Sénégal',
      category: data.category || 'mariage',
      coverPhotoUrl:
        data.coverPhotoUrl ||
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
      status: data.status || 'ACTIF',
      privacy: data.privacy || 'PUBLIC',
      accessPin: data.accessPin || '',
      viewsCount: 0,
      downloadsCount: 0,
      photosCount: 0,
      defaultPricePerPhotoCFA: data.defaultPricePerPhotoCFA || 2000,
      packPriceCFA: data.packPriceCFA || 15000,
      fullGalleryPriceCFA: data.fullGalleryPriceCFA || 40000,
      watermark: data.watermark || {
        enabled: true,
        text: `${photographer.businessName.toUpperCase()} © PROOF`,
        position: 'center',
        opacity: 0.45,
      },
      galleries: [
        {
          id: defaultGalleryId,
          eventId: newId,
          name: 'Galerie Principale',
          description: 'Toutes les photos de l’événement',
          isDefault: true,
          privacy: data.privacy || 'PUBLIC',
          photoCount: 0,
        },
      ],
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const newEvents = [newEvent, ...events];
    const newLogs: AuditLog[] = [
      {
        id: `log-${Date.now()}`,
        actor: photographer.businessName,
        role: 'PHOTOGRAPHE',
        action: 'CREATION_EVENEMENT',
        target: `${newEvent.title} (${newEvent.id})`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: `Catégorie: ${newEvent.category} | Accès: ${newEvent.privacy}`,
      },
      ...auditLogs,
    ];

    setEvents(newEvents);
    setAuditLogs(newLogs);
    persistState(photographer, pendingPhotographers, newEvents, photos, orders, newLogs);
    return newEvent;
  };

  const updateEvent = (eventId: string, updates: Partial<Event>) => {
    const newEvents = events.map((ev) => (ev.id === eventId ? { ...ev, ...updates } : ev));
    setEvents(newEvents);
    persistState(photographer, pendingPhotographers, newEvents, photos, orders, auditLogs);
  };

  const addPhotosToGallery = (eventId: string, galleryId: string, newPhotosList: Partial<Photo>[]) => {
    const existingForEvent = photos.filter((p) => p.eventId === eventId);
    let nextNum = existingForEvent.length + 101;

    const formattedPhotos: Photo[] = newPhotosList.map((item, idx) => ({
      id: `photo-${Date.now()}-${idx}`,
      eventId,
      galleryId,
      title: item.title || `Photo ${nextNum + idx}`,
      filename: item.filename || `IMG_${nextNum + idx}.JPG`,
      urlOriginal: item.urlOriginal || item.urlPreview || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=95',
      urlPreview: item.urlPreview || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
      urlThumbnail: item.urlThumbnail || item.urlPreview || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=75',
      width: item.width || 4000,
      height: item.height || 3000,
      sizeBytes: item.sizeBytes || 18500000,
      priceCFA: item.priceCFA || 2000,
      tags: item.tags || ['evenement'],
      photoNumber: nextNum + idx,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }));

    const allNewPhotos = [...photos, ...formattedPhotos];

    // Update event photosCount & gallery photoCount
    const newEvents = events.map((ev) => {
      if (ev.id === eventId) {
        const updatedGalleries = ev.galleries.map((g) =>
          g.id === galleryId ? { ...g, photoCount: g.photoCount + formattedPhotos.length } : g
        );
        return {
          ...ev,
          photosCount: ev.photosCount + formattedPhotos.length,
          galleries: updatedGalleries,
        };
      }
      return ev;
    });

    const newLogs: AuditLog[] = [
      {
        id: `log-${Date.now()}`,
        actor: photographer.businessName,
        role: 'PHOTOGRAPHE',
        action: 'UPLOAD_PHOTOS',
        target: `Événement ${eventId} (+${formattedPhotos.length} photos)`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: 'Traitement MinIO / S3 simulé : Thumbnails générés, previews watermarked créées.',
      },
      ...auditLogs,
    ];

    setPhotos(allNewPhotos);
    setEvents(newEvents);
    setAuditLogs(newLogs);
    persistState(photographer, pendingPhotographers, newEvents, allNewPhotos, orders, newLogs);
  };

  const updateEventWatermark = (eventId: string, watermark: WatermarkConfig) => {
    updateEvent(eventId, { watermark });
  };

  const unlockEvent = (eventId: string, pin: string): boolean => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return false;
    if (ev.privacy === 'PUBLIC') return true;
    if (ev.accessPin === pin.trim()) {
      setUnlockedEvents((prev) => ({ ...prev, [eventId]: true }));
      return true;
    }
    return false;
  };

  const addToCart = (photo: Photo, type: 'SINGLE' | 'PACK' = 'SINGLE') => {
    if (cart.some((item) => item.photoId === photo.id)) return;
    const newItem: OrderItem = {
      photoId: photo.id,
      photoTitle: photo.title,
      thumbnailUrl: photo.urlThumbnail,
      priceCFA: type === 'SINGLE' ? photo.priceCFA : 15000,
      type,
    };
    setCart((prev) => [...prev, newItem]);
  };

  const removeFromCart = (photoId: string) => {
    setCart((prev) => prev.filter((item) => item.photoId !== photoId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const processCheckout = (
    client: { name: string; email: string; phone: string },
    paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'CARTE_BANCAIRE'
  ): Order => {
    const totalAmount = cart.reduce((sum, item) => sum + item.priceCFA, 0);
    const platformCommission = Math.round(totalAmount * 0.1); // 10% SaaS commission
    const photographerEarnings = totalAmount - platformCommission;

    const currentEventId = navigation.eventId || events[0]?.id || 'evt-fatou-abdou';
    const currentEvent = events.find((e) => e.id === currentEventId);

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `CMD-2026-${Math.floor(100 + Math.random() * 900)}`,
      eventId: currentEventId,
      eventTitle: currentEvent?.title || 'Galerie Photos',
      photographerId: currentEvent?.photographerId || photographer.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      items: [...cart],
      totalAmountCFA: totalAmount,
      platformCommissionCFA: platformCommission,
      photographerEarningsCFA: photographerEarnings,
      paymentMethod,
      paymentStatus: 'COMPLETED',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      accessGrantedUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    };

    const newOrders = [newOrder, ...orders];

    // Credit photographer wallet
    const updatedPhotog: PhotographerProfile = {
      ...photographer,
      walletBalanceCFA: photographer.walletBalanceCFA + photographerEarnings,
    };

    const newLogs: AuditLog[] = [
      {
        id: `log-${Date.now()}`,
        actor: `${client.name} (${paymentMethod})`,
        role: 'CLIENT',
        action: 'PAIEMENT_VALIDE',
        target: `${newOrder.orderNumber} — ${totalAmount.toLocaleString('fr-FR')} FCFA`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: `Commission plateforme: ${platformCommission} FCFA | Gain photographe: +${photographerEarnings} FCFA`,
      },
      ...auditLogs,
    ];

    setOrders(newOrders);
    setPhotographer(updatedPhotog);
    setAuditLogs(newLogs);
    setCart([]);
    persistState(updatedPhotog, pendingPhotographers, events, photos, newOrders, newLogs);
    return newOrder;
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPhotographer(INITIAL_PHOTOGRAPHER);
    setPendingPhotographers(PENDING_PHOTOGRAPHERS);
    setEvents(INITIAL_EVENTS);
    setPhotos(INITIAL_PHOTOS);
    setOrders(INITIAL_ORDERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCart([]);
    setUnlockedEvents({});
  };

  const allPhotographers = [photographer, ...pendingPhotographers];

  const updatePhotographerStatus = (id: string, status: import('../types').PhotographerStatus, reason?: string) => {
    if (status === 'APPROUVÉ') {
      adminApprovePhotographer(id, reason || 'Statut approuvé par administrateur');
    } else if (status === 'REFUSÉ') {
      adminRejectPhotographer(id, reason || 'Statut refusé par administrateur');
    } else if (status === 'SUSPENDU') {
      adminSuspendPhotographer(id, reason || 'Statut suspendu par administrateur');
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        navigation,
        navigateTo,
        photographer,
        pendingPhotographers,
        allPhotographers,
        photographers: allPhotographers,
        platformCommissionRate,
        setPlatformCommissionRate,
        updatePhotographerStatus,
        events,
        photos,
        orders,
        auditLogs,
        cart,
        unlockedEvents,
        registerPhotographer,
        adminApprovePhotographer,
        adminRejectPhotographer,
        adminSuspendPhotographer,
        createEvent,
        updateEvent,
        addPhotosToGallery,
        updateEventWatermark,
        unlockEvent,
        addToCart,
        removeFromCart,
        clearCart,
        processCheckout,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
