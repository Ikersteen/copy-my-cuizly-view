export type AddressType = 'restaurant' | 'user_delivery' | 'user_billing';

export interface Address {
  id?: string;
  user_id?: string;
  address_type: AddressType;
  street_number?: string;
  street_name?: string;
  apartment_unit?: string;
  neighborhood?: string;
  city: string;
  province: string;
  postal_code?: string;
  country: string;
  formatted_address: string;
  latitude?: number;
  longitude?: number;
  is_primary: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AddressInput {
  address_type: AddressType;
  street_number?: string;
  street_name?: string;
  apartment_unit?: string;
  neighborhood?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  formatted_address: string;
  latitude?: number;
  longitude?: number;
  is_primary?: boolean;
}

export interface ParsedAddress {
  street_number?: string;
  street_name?: string;
  apartment_unit?: string;
  neighborhood?: string;
  city: string;
  province: string;
  postal_code?: string;
  country: string;
}
