
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          email: string
          lease_id: string
          plan: string
          monthly_fee: number
          registration_date: string
          status: 'active' | 'suspended' | 'terminated'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          email: string
          lease_id: string
          plan: string
          monthly_fee: number
          registration_date: string
          status: 'active' | 'suspended' | 'terminated'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          email?: string
          lease_id?: string
          plan?: string
          monthly_fee?: number
          registration_date?: string
          status?: 'active' | 'suspended' | 'terminated'
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          client_id: string
          amount: number
          date: string | null
          due_date: string
          method: 'QRIS' | 'Bank Transfer' | 'E-wallet' | 'Cash' | null
          reference: string
          status: 'pending' | 'confirmed' | 'rejected'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          amount: number
          date?: string | null
          due_date: string
          method?: 'QRIS' | 'Bank Transfer' | 'E-wallet' | 'Cash' | null
          reference: string
          status: 'pending' | 'confirmed' | 'rejected'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          amount?: number
          date?: string | null
          due_date?: string
          method?: 'QRIS' | 'Bank Transfer' | 'E-wallet' | 'Cash' | null
          reference?: string
          status?: 'pending' | 'confirmed' | 'rejected'
          notes?: string | null
          created_at?: string
        }
      }
      mikrotik_leases: {
        Row: {
          id: string
          address: string
          mac_address: string
          client_id: string
          hostname: string
          status: 'active' | 'blocked' | 'expired'
          expiry_date: string
          bandwidth: '6M/3M' | '10M/5M'
          created_at: string
          last_synced: string
        }
        Insert: {
          id: string
          address: string
          mac_address: string
          client_id: string
          hostname: string
          status: 'active' | 'blocked' | 'expired'
          expiry_date: string
          bandwidth: '6M/3M' | '10M/5M'
          created_at?: string
          last_synced: string
        }
        Update: {
          id?: string
          address?: string
          mac_address?: string
          client_id?: string
          hostname?: string
          status?: 'active' | 'blocked' | 'expired'
          expiry_date?: string
          bandwidth?: '6M/3M' | '10M/5M'
          created_at?: string
          last_synced?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
