/**
 * Generate a random username with random letters and numbers
 * Example: xdtglp2V55Z37
 */
export const generateRandomUsername = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let username = '';
  
  // Generate 8 random letters
  for (let i = 0; i < 8; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Generate 5 random numbers
  for (let i = 0; i < 5; i++) {
    username += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return username;
};

/**
 * Check if username is unique in the database
 */
export const isUsernameUnique = async (
  username: string, 
  supabase: any
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();
  
  return !data && !error;
};

/**
 * Generate a unique username by checking database
 */
export const generateUniqueUsername = async (
  supabase: any
): Promise<string> => {
  let username = generateRandomUsername();
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const isUnique = await isUsernameUnique(username, supabase);
    if (isUnique) {
      return username;
    }
    username = generateRandomUsername();
    attempts++;
  }
  
  // Fallback with timestamp if all attempts fail
  return `user${Date.now()}`;
};
