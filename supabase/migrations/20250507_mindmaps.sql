-- Create mindmaps table for storing mindmap data
CREATE TABLE IF NOT EXISTS public.mindmaps (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  folder_id UUID NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS mindmaps_user_id_idx ON public.mindmaps (user_id);
CREATE INDEX IF NOT EXISTS mindmaps_folder_id_idx ON public.mindmaps (folder_id);

-- Set up Row Level Security (RLS)
ALTER TABLE public.mindmaps ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own mindmaps
CREATE POLICY "Users can view their own mindmaps" 
  ON public.mindmaps FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own mindmaps
CREATE POLICY "Users can create their own mindmaps" 
  ON public.mindmaps FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own mindmaps
CREATE POLICY "Users can update their own mindmaps" 
  ON public.mindmaps FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own mindmaps
CREATE POLICY "Users can delete their own mindmaps" 
  ON public.mindmaps FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to automatically set updated_at on update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_mindmaps_updated_at
BEFORE UPDATE ON public.mindmaps
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
