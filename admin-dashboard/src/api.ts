import type { User, Plan, SystemSetting } from './types';

const BASE_URL = 'http://localhost:3000';

let authToken = localStorage.getItem('admin_token') || '';

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('admin_token', token);
};

export const getAuthToken = () => {
  return authToken;
};

export const logout = () => {
  authToken = '';
  localStorage.removeItem('admin_token');
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': authToken ? `Bearer ${authToken}` : '',
  };
};

export const api = {
  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/users`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data.users || [];
  },

  async purgeUser(userId: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/users/${userId}/purge`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to purge user');
    return true;
  },

  async getSettings(): Promise<SystemSetting[]> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/settings`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');
    return data.settings || [];
  },

  async updateSettings(settings: { key: string; value: string }[]): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ settings }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return true;
  },

  async getPlans(): Promise<Plan[]> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/pricing/plans`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch plans');
    return data.plans || [];
  },

  async createPlan(plan: Omit<Plan, 'id' | 'is_active' | 'created_at'>): Promise<Plan> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/pricing/plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(plan),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create plan');
    return data;
  },

  async updatePlan(id: string, plan: { name: string; price_cents: number; trial_days: number }): Promise<Plan> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/pricing/plans/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(plan),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update plan');
    return data;
  },

  async upgradeUserSubscription(userId: string, status: string, planSlug: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/api/v1/admin/subscriptions/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, plan_slug: planSlug }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update subscription');
    return true;
  }
};
