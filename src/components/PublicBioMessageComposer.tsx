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

export default function PublicBioMessageForm({
  receiverUsername,
  receiverProfileId,
  senderUsername,
  senderProfileId,
}: PublicBioMessageFormProps) {
  const { isAuthenticated } = usePi();
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
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl && imageFile) {
          toast.error('Failed to upload image, but message will be sent');
        }
      }

      const { error } = await (supabase
        .from('messages' as any)
        .insert({
          sender_profile_id: senderProfileId || null,
          receiver_profile_id: receiverProfileId,
          content: message.trim() || (imageUrl ? '[Image]' : ''),
          image_url: imageUrl,
          is_read: false,
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

  return (
    <Card className="bg-white/8 dark:bg-white/5 backdrop-blur-2xl border border-white/12 dark:border-white/10 shadow-2xl shadow-sky-500/15 dark:shadow-sky-900/35 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-white/90 drop-shadow-sm text-sm">
          <MessageSquare className="h-4 w-4" />
          Message @{receiverUsername}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-3">
          {imagePreview && (
            <div className="relative inline-block mb-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-xl border border-white/20"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={removeImage}
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full bg-white/10 dark:bg-white/8 border border-white/15 dark:border-white/10 px-3 py-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="h-8 w-8 text-white/80"
              aria-label="Add image"
            >
              <Image className="h-4 w-4" />
            </Button>
            <Textarea
              placeholder="Message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={1}
              className="flex-1 resize-none bg-transparent focus-visible:ring-0 border-0 text-white placeholder:text-white/60 py-1"
            />
            <Button
              type="submit"
              disabled={sending || (!message.trim() && !imageFile)}
              className="h-8 px-3 rounded-full"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
