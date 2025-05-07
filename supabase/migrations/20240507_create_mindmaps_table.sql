-- Create the mindmaps table
CREATE TABLE IF NOT EXISTS public.mindmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  graph JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS mindmaps_user_id_idx ON public.mindmaps(user_id);
CREATE INDEX IF NOT EXISTS mindmaps_updated_at_idx ON public.mindmaps(updated_at);

-- Set up Row Level Security (RLS)
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to select only their own mindmaps
CREATE POLICY "Users can view their own mindmaps" 
  ON public.mindmaps 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own mindmaps
CREATE POLICY "Users can create their own mindmaps" 
  ON public.mindmaps 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own mindmaps
CREATE POLICY "Users can update their own mindmaps" 
  ON public.mindmaps 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete only their own mindmaps
CREATE POLICY "Users can delete their own mindmaps" 
  ON public.mindmaps 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.mindmaps
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
