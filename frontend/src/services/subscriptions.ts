import { api } from '../lib/api';
import { SubscriptionPlan } from '../types/api';

export function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return api.get('/api/subscriptions/plans/');
}
