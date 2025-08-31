-- Migration de sécurité : Correction des 16 avertissements RLS (CORRECTED)
-- Restriction de l'accès aux utilisateurs authentifiés uniquement

-- 1. Table Comments - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Only authenticated users can view active comments" ON public.Comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.Comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.Comments;
DROP POLICY IF EXISTS "Authenticated users can create their own comments" ON public.Comments;

CREATE POLICY "Only authenticated users can view active comments" 
ON public.Comments FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Users can delete their own comments" 
ON public.Comments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.Comments FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own comments" 
ON public.Comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Table menus - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Authenticated users can view active menus" ON public.menus;
DROP POLICY IF EXISTS "Restaurant owners manage menus" ON public.menus;

CREATE POLICY "Authenticated users can view active menus" 
ON public.menus FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Restaurant owners manage menus" 
ON public.menus FOR ALL 
TO authenticated 
USING (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.owner_id = auth.uid()));

-- 3. Table offers - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Authenticated users can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Restaurant owners manage offers" ON public.offers;

CREATE POLICY "Authenticated users can view active offers" 
ON public.offers FOR SELECT 
TO authenticated 
USING (is_active = true);

CREATE POLICY "Restaurant owners manage offers" 
ON public.offers FOR ALL 
TO authenticated 
USING (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.owner_id = auth.uid()));

-- 4. Table orders - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Authenticated restaurant owners can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated restaurant owners can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view own orders" ON public.orders;

CREATE POLICY "Authenticated restaurant owners can update orders" 
ON public.orders FOR UPDATE 
TO authenticated 
USING (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.owner_id = auth.uid()));

CREATE POLICY "Authenticated restaurant owners can view orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.owner_id = auth.uid()));

CREATE POLICY "Authenticated users can create own orders" 
ON public.orders FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Table profiles - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Users can delete own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

CREATE POLICY "Users can delete own profile only" 
ON public.profiles FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile only" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile only" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile only" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 6. Table ratings - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Authenticated users can create ratings" ON public.ratings;
DROP POLICY IF EXISTS "Authenticated users can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Authenticated users can view ratings for active restaurants" ON public.ratings;

CREATE POLICY "Authenticated users can create ratings" 
ON public.ratings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own ratings" 
ON public.ratings FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view ratings for active restaurants" 
ON public.ratings FOR SELECT 
TO authenticated 
USING (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.is_active = true));

-- 7. Table restaurant_analytics - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Authenticated restaurant owners can view analytics" ON public.restaurant_analytics;
DROP POLICY IF EXISTS "Restaurant owners can manage analytics" ON public.restaurant_analytics;
DROP POLICY IF EXISTS "Restaurant owners can view own analytics" ON public.restaurant_analytics;

CREATE POLICY "Authenticated restaurant owners can view analytics" 
ON public.restaurant_analytics FOR SELECT 
TO authenticated 
USING (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.owner_id = auth.uid()));

CREATE POLICY "Restaurant owners can manage analytics" 
ON public.restaurant_analytics FOR ALL 
TO authenticated 
USING (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.owner_id = auth.uid())) 
WITH CHECK (restaurant_id IN (SELECT restaurants.id FROM restaurants WHERE restaurants.owner_id = auth.uid()));

-- 8. Table restaurants - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Anonymous users no direct access" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated restaurant owners can create restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated restaurant owners can delete restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated restaurant owners can update restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated users can view public restaurant data only" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners full access to own restaurants" ON public.restaurants;

CREATE POLICY "Authenticated restaurant owners can create restaurants" 
ON public.restaurants FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Authenticated restaurant owners can delete restaurants" 
ON public.restaurants FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated restaurant owners can update restaurants" 
ON public.restaurants FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can view public restaurant data only" 
ON public.restaurants FOR SELECT 
TO authenticated 
USING (is_active = true AND auth.uid() <> owner_id);

CREATE POLICY "Restaurant owners full access to own restaurants" 
ON public.restaurants FOR ALL 
TO authenticated 
USING (auth.uid() = owner_id) 
WITH CHECK (auth.uid() = owner_id);

-- 9. Table security_audit_log - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;

CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log FOR SELECT 
TO authenticated 
USING (is_admin());

CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 10. Table user_favorites - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_favorites;

CREATE POLICY "Users can delete own favorites" 
ON public.user_favorites FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" 
ON public.user_favorites FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites" 
ON public.user_favorites FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 11. Table user_preferences - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Authenticated users can create own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Authenticated users can delete own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Authenticated users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Authenticated users can view own preferences" ON public.user_preferences;

CREATE POLICY "Authenticated users can create own preferences" 
ON public.user_preferences FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own preferences" 
ON public.user_preferences FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own preferences" 
ON public.user_preferences FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own preferences" 
ON public.user_preferences FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 12. Table user_roles - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (is_admin());

CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- 13. Table waitlist_analytics - Corriger les politiques d'accès anonyme
DROP POLICY IF EXISTS "Anyone can insert into waitlist" ON public.waitlist_analytics;
DROP POLICY IF EXISTS "Only admins can read waitlist entries" ON public.waitlist_analytics;

-- Permettre l'insertion pour les visiteurs non authentifiés (formulaire de contact)
CREATE POLICY "Anyone can insert into waitlist" 
ON public.waitlist_analytics FOR INSERT 
WITH CHECK (true);

-- Seuls les admins peuvent lire
CREATE POLICY "Only admins can read waitlist entries" 
ON public.waitlist_analytics FOR SELECT 
TO authenticated 
USING (is_admin());