import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/Header';
import { useAllCampaigns, useUpdateCampaign } from '@/hooks/useAdCampaigns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { PageLoader } from '@/components/PageLoader';

export default function AdModeration() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { data: campaigns, isLoading } = useAllCampaigns();
  const updateCampaign = useUpdateCampaign();
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/auth');
  }, [user, isAdmin, loading, navigate]);

  const handleApprove = async (id: string) => {
    try {
      await updateCampaign.mutateAsync({ id, status: 'active' });
      toast.success('Ad approved and activated');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReject = async (id: string) => {
    try {
      await updateCampaign.mutateAsync({ id, status: 'rejected' });
      toast.success('Ad rejected');
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = campaigns?.filter(c => {
    if (tab === 'all') return true;
    return c.status === tab;
  }) || [];

  const pendingCount = campaigns?.filter(c => c.status === 'pending').length || 0;

  if (loading || !isAdmin) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Ad Moderation</h1>
        <p className="text-muted-foreground mb-6">Review and approve ad campaigns</p>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['pending', 'active', 'rejected', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize flex items-center gap-2 ${
                tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {t}
              {t === 'pending' && pendingCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageLoader label="Loading ads..." fullscreen={false} />
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="p-4 rounded-2xl bg-card flex items-center gap-4">
                <div className="flex-shrink-0 h-20 w-20 rounded-xl bg-muted overflow-hidden">
                  {c.media_type === 'image' ? (
                    <img src={c.media_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video src={c.media_url} className="h-full w-full object-cover" muted />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{c.ad_type}</Badge>
                    <Badge variant="outline">{c.media_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{c.destination_url}</p>
                  {c.title && <p className="text-sm text-foreground mt-1">{c.title}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {c.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(c.id)} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(c.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  <a href={c.media_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-12 text-center">No ads found</p>
        )}
      </main>
    </div>
  );
}
