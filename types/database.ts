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
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          credits: number
          subscription_tier: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      avatars: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'preset' | 'custom'
          style: string | null
          midjourney_ref: string | null
          preview_images: Json | null
          lora_weights_url: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'preset' | 'custom'
          style?: string | null
          midjourney_ref?: string | null
          preview_images?: Json | null
          lora_weights_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'preset' | 'custom'
          style?: string | null
          midjourney_ref?: string | null
          preview_images?: Json | null
          lora_weights_url?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessories' | 'beauty'
          original_image_url: string
          processed_image_url: string | null
          metadata: Json | null
          ip_adapter_embedding: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessories' | 'beauty'
          original_image_url: string
          processed_image_url?: string | null
          metadata?: Json | null
          ip_adapter_embedding?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessories' | 'beauty'
          original_image_url?: string
          processed_image_url?: string | null
          metadata?: Json | null
          ip_adapter_embedding?: string | null
          created_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          avatar_ids: string[]
          product_id: string | null
          background_type: 'preset' | 'custom_image' | 'custom_video'
          background_id: string | null
          action_type: 'walk' | 'stand_pose' | 'turn' | 'casual_movement' | 'custom'
          action_reference_url: string | null
          style_references: Json | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          progress: number
          current_step: string | null
          output_video_url: string | null
          thumbnail_url: string | null
          metadata: Json | null
          retry_count: number
          error_message: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          avatar_ids: string[]
          product_id?: string | null
          background_type: 'preset' | 'custom_image' | 'custom_video'
          background_id?: string | null
          action_type: 'walk' | 'stand_pose' | 'turn' | 'casual_movement' | 'custom'
          action_reference_url?: string | null
          style_references?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          current_step?: string | null
          output_video_url?: string | null
          thumbnail_url?: string | null
          metadata?: Json | null
          retry_count?: number
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          avatar_ids?: string[]
          product_id?: string | null
          background_type?: 'preset' | 'custom_image' | 'custom_video'
          background_id?: string | null
          action_type?: 'walk' | 'stand_pose' | 'turn' | 'casual_movement' | 'custom'
          action_reference_url?: string | null
          style_references?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          progress?: number
          current_step?: string | null
          output_video_url?: string | null
          thumbnail_url?: string | null
          metadata?: Json | null
          retry_count?: number
          error_message?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          tier: 'free' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due'
          current_period_end: string | null
          credits_per_month: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          tier: 'free' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due'
          current_period_end?: string | null
          credits_per_month?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string | null
          tier?: 'free' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due'
          current_period_end?: string | null
          credits_per_month?: number | null
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          job_id: string | null
          amount: number
          type: 'usage' | 'purchase' | 'refund' | 'subscription'
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id?: string | null
          amount: number
          type: 'usage' | 'purchase' | 'refund' | 'subscription'
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          job_id?: string | null
          amount?: number
          type?: 'usage' | 'purchase' | 'refund' | 'subscription'
          balance_after?: number
          created_at?: string
        }
      }
    }
  }
}
