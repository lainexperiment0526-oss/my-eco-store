import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApps } from '@/hooks/useApps';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Feedback() {
  const { user } = useAuth();
  const { data: apps } = useApps();
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectableApps = useMemo(() => {
    const list = apps || [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [apps]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Sign in to send feedback');
      return;
    }
    if (!selectedAppId || !text.trim()) {
      toast.error('Select an app and enter feedback');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('app_feedback')
      .insert({ app_id: selectedAppId, user_id: user.id, feedback_text: text.trim() });
    setIsSubmitting(false);
    if (error) {
      toast.error('Failed to send feedback');
      return;
    }
    toast.success('Feedback sent');
    setText('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Send Feedback</h1>
        <p className="text-muted-foreground mb-6">
          Share feedback about an app to help developers improve.
        </p>

        {!user && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <p className="text-muted-foreground">
              Please <Link to="/auth" className="text-primary hover:underline">sign in</Link> to send feedback.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="app">App</Label>
            <Select value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger id="app" className="mt-2">
                <SelectValue placeholder="Select an app" />
              </SelectTrigger>
              <SelectContent>
                {selectableApps.map(app => (
                  <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectableApps.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">No apps available.</p>
            )}
          </div>

          <div>
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your feedback about this app..."
              rows={6}
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!user || isSubmitting || !selectedAppId || !text.trim()}
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </div>
      </main>
    </div>
  );
}
