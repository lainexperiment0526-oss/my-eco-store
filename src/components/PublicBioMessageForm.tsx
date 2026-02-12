import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePi } from '@/contexts/PiContext';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, AlertCircle, Send, Image, X } from 'lucide-react';
import { toast } from 'sonner';

interface PublicBioMessageFormProps {
  receiverUsername: string;
  receiverProfileId: string;
  senderUsername?: string;
  senderProfileId?: string;
}

interface Message {
  id: string;
  sender_profile_id: string;
  receiver_profile_id: string;
  content: string;
  image_url?: string;
  is_read: boolean;
  created_at: string;
}

export default function PublicBioMessageForm({ 
  receiverUsername, 
  receiverProfileId,
  senderUsername,
  senderProfileId 
}: PublicBioMessageFormProps) {
  const { isAuthenticated, piUser } = usePi();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `messages/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('message-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && !imageFile) {
      toast.error('Please enter a message or attach an image');
      return;
    }

    if (!receiverProfileId) {
      toast.error('Cannot send message - recipient profile not found');
      return;
    }

    setSending(true);
    try {
      let imageUrl: string | null = null;
      
      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl && imageFile) {
          toast.error('Failed to upload image, but message will be sent');
        }
      }

      // Insert message into database using type assertion
      const { error } = await (supabase
        .from('messages' as any)
        .insert({
          sender_profile_id: senderProfileId || null,
          receiver_profile_id: receiverProfileId,
          content: message.trim() || (imageUrl ? '[Image]' : ''),
          image_url: imageUrl,
          is_read: false
        }) as any);

      if (error) {
        console.error('Message insert error:', error);
        throw error;
      }

      toast.success('Message sent successfully!');
      setMessage('');
      removeImage();
    } catch (err: any) {
      console.error('Send message error:', err);
      toast.error(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="bg-white/8 dark:bg-white/5 backdrop-blur-2xl border border-white/12 dark:border-white/10 shadow-2xl shadow-sky-500/15 dark:shadow-sky-900/35 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white drop-shadow-sm">
            <MessageSquare className="h-5 w-5" />
            Send a Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 ml-2">
              Please sign in with Pi Network to send messages to @{receiverUsername}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/8 dark:bg-white/5 backdrop-blur-2xl border border-white/12 dark:border-white/10 shadow-2xl shadow-sky-500/15 dark:shadow-sky-900/35 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white drop-shadow-sm">
          <MessageSquare className="h-5 w-5" />
          Send a Message to @{receiverUsername}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="resize-none bg-white/10 dark:bg-white/8 backdrop-blur-xl text-white border border-white/15 dark:border-white/15 placeholder:text-white/70 shadow-inner shadow-slate-900/10"
          />
          
          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-32 rounded-lg border"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button 
              type="submit" 
              disabled={sending || (!message.trim() && !imageFile)} 
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
