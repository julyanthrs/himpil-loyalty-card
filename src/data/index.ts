import { DemoService } from './demoService';
import type { LoyaltyService } from './service';
import { SupabaseService } from './supabaseService';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const service: LoyaltyService = url && key ? new SupabaseService(url, key) : new DemoService();
export const isDemo = service.mode === 'demo';
export type { LoyaltyService };
