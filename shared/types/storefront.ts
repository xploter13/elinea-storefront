export interface ApiEnvelope<T> { data: T }

export interface StoreSite {
  id: number
  name: string
  slug: string
  domain: string | null
  segment: string
  plan_id: number | null
  status: string
  billing_status: string | null
  billing_ends_at: string | null
  trial_ends_at: string | null
}

export interface StoreCategory {
  id: number
  parent_id: number | null
  name: string
  slug: string
  description: string | null
  priority: number
  is_active: boolean
}

export interface ProductVariation {
  name: string
  sku: string
  price: number | null
  original_price: number | null
  stock: number
  image_path: string | null
  attributes: Record<string, string>
}

export interface StoreProduct {
  id: number
  name: string
  slug: string
  sku: string
  price: number
  original_price: number | null
  stock: number
  variations: ProductVariation[]
  state: string | null
  is_featured: boolean
  description: string | null
  excerpt: string | null
  image_path: string | null
  image_url?: string | null
  meta_description: string | null
  brand_id: number | null
  categories: StoreCategory[]
}

export interface AnalyticsConfiguration {
  enabled: boolean
  google_analytics_4: { enabled: boolean, measurement_id: string | null }
  facebook_pixel: { enabled: boolean, pixel_id: string | null }
}

export interface StorefrontPayload {
  site: StoreSite
  theme: import('./branding').StorefrontBranding
  products: StoreProduct[]
  categories: StoreCategory[]
  analytics: AnalyticsConfiguration | null
  newsletter: { enabled: boolean } | null
  warnings: string[]
}
