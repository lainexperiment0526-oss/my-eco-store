import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

interface EmailCaptureDisplayProps {
  title: string;
  description: string;
  placeholder?: string;
  button_text?: string;
  onSubmit: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export const EmailCaptureDisplay = ({
  title,
  description,
  placeholder = 'your@email.com',
  button_text = 'Subscribe',
  onSubmit,
  isLoading = false
}: EmailCaptureDisplayProps) => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(email);
      toast.success('Thanks! Email captured.');
      setEmail('');
    } catch (error) {
      toast.error('Failed to capture email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/70 bg-gradient-to-br from-sky-50/50 to-blue-50/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6 sm:p-8 shadow-sm">
      <div className="flex gap-3 mb-4">
        <Mail className="w-6 h-6 text-sky-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{description}</p>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row sm:items-stretch gap-2 w-full"
      >
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting || isLoading}
          className="flex-1 w-full min-w-0"
        />
        <Button
          type="submit"
          disabled={submitting || isLoading}
          className="bg-sky-500 hover:bg-sky-600 text-white w-full sm:w-auto shrink-0"
        >
          {submitting ? 'Subscribing...' : button_text}
        </Button>
      </form>
    </div>
  );
};
