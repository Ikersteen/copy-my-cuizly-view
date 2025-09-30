/**
 * Generate a random username in the format: word + 4 random digits
 * Example: chef1234, resto5678, etc.
 */
export const generateRandomUsername = (): string => {
  const words = [
    'chef', 'resto', 'food', 'gourmet', 'saveur', 
    'cuisine', 'taste', 'menu', 'cook', 'dine'
  ];
  
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNumbers = Math.floor(1000 + Math.random() * 9000); // 4 digits between 1000-9999
  
  return `${randomWord}${randomNumbers}`;
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
