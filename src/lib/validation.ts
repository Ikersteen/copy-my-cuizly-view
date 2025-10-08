import DOMPurify from 'dompurify';

// Input length limits for security
export const INPUT_LIMITS = {
  TITLE: 100,
  DESCRIPTION: 500,
  NAME: 80,
  ADDRESS: 200,
  PHONE: 20,
  EMAIL: 254, // RFC standard
  USERNAME: 30,
} as const;

// Sanitize HTML content to prevent XSS
export const sanitizeHtml = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
};

// Sanitize and validate text input
export const validateTextInput = (
  value: string, 
  maxLength: number, 
  fieldName: string = 'Field'
): { isValid: boolean; sanitized: string; error?: string } => {
  // Sanitize first
  const sanitized = sanitizeHtml(value.trim());
  
  // Check length
  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      sanitized,
      error: `${fieldName} must be less than ${maxLength} characters`
    };
  }
  
  return { isValid: true, sanitized };
};

// Validate email format
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (trimmed.length > INPUT_LIMITS.EMAIL) {
    return { isValid: false, error: 'Email too long' };
  }
  
  return { isValid: true };
};

// Validate phone number (basic format check)
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
  const cleaned = phone.replace(/\s/g, '');
  
  if (cleaned.length > 0 && !phoneRegex.test(phone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  if (phone.length > INPUT_LIMITS.PHONE) {
    return { isValid: false, error: 'Phone number too long' };
  }
  
  return { isValid: true };
};

// Validate password strength with enhanced security
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must contain at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must contain less than 128 characters' };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChar) {
    return { 
      isValid: false, 
      error: 'Password must contain at least one uppercase, one lowercase, one number and one special character' 
    };
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /(.)\1{2,}/, // repeated characters
    /123456/, /password/i, /qwerty/i, // common patterns
  ];
  
  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, error: 'Password contains weak patterns' };
    }
  }
  
  return { isValid: true };
};

// Sanitize array of strings (e.g., cuisine types, dietary restrictions)
export const sanitizeStringArray = (arr: string[]): string[] => {
  return arr
    .map(item => sanitizeHtml(item.trim()))
    .filter(item => item.length > 0 && item.length <= 50) // Individual item length limit
    .slice(0, 10); // Limit array size
};

// Validate rating comment with enhanced security
export const validateRatingComment = (comment: string): { isValid: boolean; sanitized: string; error?: string } => {
  const result = validateTextInput(comment, INPUT_LIMITS.DESCRIPTION, 'Comment');
  
  if (!result.isValid) {
    return result;
  }
  
  // Additional checks for comments
  if (result.sanitized.length > 0 && result.sanitized.length < 3) {
    return {
      isValid: false,
      sanitized: result.sanitized,
      error: 'Comment must be at least 3 characters if provided'
    };
  }
  
  return result;
};

// Validate restaurant description with enhanced security
export const validateRestaurantDescription = (description: string): { isValid: boolean; sanitized: string; error?: string } => {
  const result = validateTextInput(description, INPUT_LIMITS.DESCRIPTION, 'Description');
  
  if (!result.isValid) {
    return result;
  }
  
  // Ensure minimum length for meaningful descriptions
  if (result.sanitized.length > 0 && result.sanitized.length < 10) {
    return {
      isValid: false,
      sanitized: result.sanitized,
      error: 'Description must be at least 10 characters if provided'
    };
  }
  
  return result;
};