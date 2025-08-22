-- Add INSERT policy for orders table to allow authenticated users to create orders
CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);