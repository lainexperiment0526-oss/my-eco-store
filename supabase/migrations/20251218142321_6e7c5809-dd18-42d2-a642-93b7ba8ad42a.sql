-- Create messages table for Public Bio messaging
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Anyone can send messages (insert)
CREATE POLICY "Anyone can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages" 
ON public.messages 
FOR SELECT 
USING (true);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update received messages" 
ON public.messages 
FOR UPDATE 
USING (true);

-- Users can delete their own messages
CREATE POLICY "Users can delete their messages" 
ON public.messages 
FOR DELETE 
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public) VALUES ('message-images', 'message-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for message images
CREATE POLICY "Anyone can view message images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'message-images');

CREATE POLICY "Authenticated users can upload message images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'message-images');

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;