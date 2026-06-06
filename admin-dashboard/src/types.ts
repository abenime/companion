export interface User {
  id: string;
  name: string;
  email: string;
  cohort?: string;
  subscription_status?: 'active' | 'trialing' | 'free' | 'canceled';
  subscription_plan?: string;
  signals_last_24h?: number;
  last_ingestion_time?: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  trial_days: number;
  is_active: boolean;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  category: 'gemini' | 'telemetry' | 'notifications' | 'general';
  description?: string;
}
