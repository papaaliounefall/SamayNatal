import { api } from '../lib/api';
import { Order, OrderItemType, Paginated, PaymentMethod } from '../types/api';

export interface CartLine {
  itemType: OrderItemType;
  photoId?: string;
  photoIds?: string[];
}

export interface CreateOrderPayload {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  paymentMethod: PaymentMethod;
  cartItems: CartLine[];
  idempotencyKey?: string;
}

export interface CreateOrderResult {
  order: Order;
  payment: { providerReference: string; redirectUrl: string | null; reused?: boolean };
}

export function createOrder(eventSlug: string, data: CreateOrderPayload): Promise<CreateOrderResult> {
  return api.post(`/api/public/events/${eventSlug}/orders/`, data);
}

/** Sandbox-only: simulates the payment provider's webhook so the
 * checkout flow can be exercised without a live Wave/Orange Money/card
 * integration. The backend refuses this outside DEBUG. */
export function devConfirmPayment(providerReference: string, succeeded = true): Promise<Order> {
  return api.post('/api/payments/dev-confirm/', { providerReference, succeeded });
}

export function fetchMyOrders(): Promise<Paginated<Order>> {
  return api.get('/api/orders/?page_size=200');
}
