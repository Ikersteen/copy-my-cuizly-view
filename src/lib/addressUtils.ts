import type { ParsedAddress, AddressInput } from '@/types/address';
import { getCityByPostalCode, detectCityFromAddress, MONTREAL_CONFIG, REPENTIGNY_CONFIG } from "@/constants/cities";

/**
 * Parse a formatted address string into components
 * Handles Montreal-specific address formats like:
 * "1234 Rue Sainte-Catherine, Plateau-Mont-Royal, Montréal, QC H2X 3A5"
 * "Plateau-Mont-Royal, Montréal, QC"
 */
export function parseAddress(formattedAddress: string): ParsedAddress {
  const parts = formattedAddress.split(',').map(part => part.trim());
  
  const result: ParsedAddress = {
    city: 'Montréal',
    province: 'QC',
    country: 'Canada'
  };

  if (parts.length === 0) return result;

  // Last part usually contains province and postal code
  const lastPart = parts[parts.length - 1];
  const provincePostalMatch = lastPart.match(/([A-Z]{2})(?:\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d))?/);
  if (provincePostalMatch) {
    result.province = provincePostalMatch[1];
    if (provincePostalMatch[2]) {
      result.postal_code = provincePostalMatch[2].replace(/\s/g, '');
    }
  }

  // Second to last is usually the city
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 2];
    if (cityPart && !cityPart.match(/^[A-Z]{2}/)) {
      result.city = cityPart;
    }
  }

  // Process remaining parts for street address and apartment unit
  const addressParts = parts.slice(0, -2);
  
  if (addressParts.length >= 1) {
    const streetPart = addressParts[0];
    
    // Check for apartment unit in the street part (e.g., "131 Rue Louvain, #101")
    const apartmentMatch = streetPart.match(/^(.+?),?\s*[#]?(\d+[A-Za-z]?)$/);
    let streetAddress = streetPart;
    
    if (apartmentMatch) {
      streetAddress = apartmentMatch[1].trim();
      result.apartment_unit = apartmentMatch[2];
    }
    
    // Parse street address for number and name
    const streetMatch = streetAddress.match(/^(\d+)\s+(.+)$/);
    if (streetMatch) {
      result.street_number = streetMatch[1];
      result.street_name = streetMatch[2];
    } else {
      result.street_name = streetAddress;
    }
    
    // Second part could be neighborhood
    if (addressParts.length >= 2) {
      result.neighborhood = addressParts[1];
    }
  }

  return result;
}

/**
 * Format address components into a readable string
 */
export function formatAddress(address: Partial<ParsedAddress>): string {
  const parts: string[] = [];

  // Street address
  if (address.street_number && address.street_name) {
    parts.push(`${address.street_number} ${address.street_name}`);
  } else if (address.street_name) {
    parts.push(address.street_name);
  }

  // Apartment/unit
  if (address.apartment_unit) {
    if (parts.length > 0) {
      parts[parts.length - 1] += `, App. ${address.apartment_unit}`;
    } else {
      parts.push(`App. ${address.apartment_unit}`);
    }
  }

  // Neighborhood
  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }

  // City
  if (address.city) {
    parts.push(address.city);
  }

  // Province and postal code
  const provincePart = address.province || 'QC';
  const postalPart = address.postal_code ? ` ${address.postal_code}` : '';
  parts.push(provincePart + postalPart);

  return parts.join(', ');
}

/**
 * Validate Montreal postal code format
 */
export function isValidMontrealPostalCode(postalCode: string): boolean {
  const cleanCode = postalCode.replace(/\s/g, '').toUpperCase();
  
  // Montreal postal codes start with H
  const montrealPattern = /^H[0-9][A-Z][0-9][A-Z][0-9]$/;
  return montrealPattern.test(cleanCode);
}

/**
 * Validate Repentigny postal code format
 */
export function isValidRepentinyPostalCode(postalCode: string): boolean {
  const cleanCode = postalCode.replace(/\s/g, '').toUpperCase();
  
  // Repentigny postal codes: J5Y, J6A, J6B
  const repentinyPattern = /^(J5Y|J6A|J6B)[0-9][A-Z][0-9]$/;
  return repentinyPattern.test(cleanCode);
}

/**
 * Validate postal code for supported cities
 */
export function isValidPostalCode(postalCode: string): boolean {
  return isValidMontrealPostalCode(postalCode) || isValidRepentinyPostalCode(postalCode);
}

/**
 * Clean and format postal code
 */
export function formatPostalCode(postalCode: string): string {
  const clean = postalCode.replace(/\s/g, '').toUpperCase();
  if (clean.length === 6) {
    return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  }
  return clean;
}

/**
 * Validate address input
 */
export function validateAddressInput(address: Partial<AddressInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!address.formatted_address?.trim()) {
    errors.formatted_address = 'L\'adresse complète est requise';
  }

  if (address.postal_code && !isValidPostalCode(address.postal_code)) {
    errors.postal_code = 'Code postal invalide (Montréal: H#X #X#, Repentigny: J5Y/J6A/J6B #X#)';
  }

  if (address.street_name && address.street_name.length < 2) {
    errors.street_name = 'Le nom de rue doit contenir au moins 2 caractères';
  }

  if (address.street_number && !/^\d+[A-Z]?$/i.test(address.street_number)) {
    errors.street_number = 'Numéro de rue invalide';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Create AddressInput from formatted address string
 */
export function createAddressInput(
  formattedAddress: string,
  addressType: AddressInput['address_type'],
  isPrimary = true
): AddressInput {
  const parsed = parseAddress(formattedAddress);
  const detectedCity = detectCityFromAddress(formattedAddress);
  
  return {
    address_type: addressType,
    formatted_address: formattedAddress,
    street_number: parsed.street_number,
    street_name: parsed.street_name,
    apartment_unit: parsed.apartment_unit,
    neighborhood: parsed.neighborhood,
    city: parsed.city || detectedCity.name,
    province: parsed.province || detectedCity.province,
    postal_code: parsed.postal_code,
    country: parsed.country || detectedCity.country,
    is_primary: isPrimary
  };
}

/**
 * Format restaurant address in standard format: "131 Rue Louvain, #101, Repentigny, QC J6A 0A1, Canada"
 */
export function formatRestaurantAddress(address: string): string {
  if (!address) return '';
  
  const parsed = parseAddress(address);
  const parts: string[] = [];

  // Street address (number + name)
  if (parsed.street_number && parsed.street_name) {
    let streetAddress = `${parsed.street_number} ${parsed.street_name}`;
    
    // Add apartment unit if present
    if (parsed.apartment_unit) {
      streetAddress += `, #${parsed.apartment_unit}`;
    }
    
    parts.push(streetAddress);
  } else if (parsed.street_name) {
    let streetAddress = parsed.street_name;
    
    // Add apartment unit if present
    if (parsed.apartment_unit) {
      streetAddress += `, #${parsed.apartment_unit}`;
    }
    
    parts.push(streetAddress);
  } else {
    // If we can't parse street components, use the first part of the original address
    const firstPart = address.split(',')[0]?.trim();
    if (firstPart) {
      parts.push(firstPart);
    }
  }

  // City
  if (parsed.city) {
    parts.push(parsed.city);
  }

  // Province and postal code
  let provincePart = parsed.province || 'QC';
  if (parsed.postal_code) {
    provincePart += ` ${parsed.postal_code}`;
  }
  parts.push(provincePart);

  // Country
  parts.push(parsed.country || 'Canada');

  return parts.join(', ');
}

/**
 * Check if two addresses are the same
 */
export function areAddressesEqual(addr1: Partial<ParsedAddress>, addr2: Partial<ParsedAddress>): boolean {
  return (
    addr1.street_number === addr2.street_number &&
    addr1.street_name === addr2.street_name &&
    addr1.apartment_unit === addr2.apartment_unit &&
    addr1.neighborhood === addr2.neighborhood &&
    addr1.city === addr2.city &&
    addr1.province === addr2.province &&
    addr1.postal_code === addr2.postal_code
  );
}