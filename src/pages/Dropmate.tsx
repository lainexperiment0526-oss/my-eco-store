import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePi } from "@/contexts/PiContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { FooterNav } from "@/components/FooterNav";

interface Message {
  id: string;
  content: string;
  role: string;
  created_at: string;
  session_id: string;
}

const Dropmate = () => {
  const { piUser } = usePi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (piUser?.username) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [piUser]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Get profile ID first
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", piUser?.username)
        .maybeSingle();

      if (!profile) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Get AI chat messages for this profile
      const { data, error } = await supabase
        .from("ai_chat_messages")
        .select("id, content, role, created_at, session_id")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Failed to load messages:", error);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-400">
      <PageHeader 
        title="Dropmate" 
        description="View your chat history"
        icon={<MessageSquare />}
      />
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 max-w-4xl mx-auto pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Messages & Chat History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading messages...</p>
          ) : (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-muted-foreground">No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        message.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {message.role === 'user' ? 'You' : 'AI'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Dropmate;
