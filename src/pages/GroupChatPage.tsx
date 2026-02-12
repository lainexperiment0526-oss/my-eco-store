import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePi } from '@/contexts/PiContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, X, Settings, Trash2, UserPlus, LogOut, Mic, Video } from 'lucide-react';
import { toast } from 'sonner';
import { uploadMessageImage, uploadMessageMedia, uploadImage, STORAGE_BUCKETS } from '@/lib/supabase-storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Message {
  id: string;
  sender_profile_id: string;
  group_id: string;
  content: string;
  image_url?: string;
  media_url?: string;
  media_type?: string;
  created_at: string;
  sender_username?: string;
  sender_logo?: string;
}

interface Group {
  id: string;
  name: string;
  avatar_url?: string;
  description?: string;
  created_by?: string;
  theme_color?: string;
}

interface GroupMember {
  profile_id: string;
  role: 'admin' | 'member';
  username: string;
  logo?: string;
}

export default function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { piUser } = usePi();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [groupThemeColor, setGroupThemeColor] = useState('#3b82f6');
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [newGroupAvatar, setNewGroupAvatar] = useState<File | null>(null);
  const [newGroupAvatarPreview, setNewGroupAvatarPreview] = useState<string | null>(null);

  // Group Info State
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const [addMemberResults, setAddMemberResults] = useState<any[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);

  useEffect(() => {
    if (piUser?.username && groupId) {
      loadProfileAndGroup();
    }
  }, [piUser, groupId]);

  useEffect(() => {
    if (myProfileId && groupId) {
      loadMessages();
      loadGroupMembers();

      // Subscribe to new group messages
      const channel = supabase
        .channel(`group-chat-${groupId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `group_id=eq.${groupId}`
          },
          (payload) => {
            console.log('New group message received:', payload);
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [myProfileId, groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProfileAndGroup = async () => {
    try {
      // Get my profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', piUser!.username)
        .single();

      if (myProfile) {
        setMyProfileId(myProfile.id);
      }

      // Get group details
      const { data: groupData, error } = await supabase
        .from('groups' as any)
        .select('*')
        .eq('id', groupId)
        .single();

      if (error || !groupData) {
        toast.error('Group not found');
        navigate('/inbox');
        return;
      }

      setGroup(groupData);
      setGroupThemeColor(groupData?.theme_color || '#3b82f6');
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    }
  };

  const loadMessages = async () => {
    if (!groupId) return;

    setLoading(true);
    try {
      // Fetch messages for this group
      const { data, error } = await supabase
        .from('messages' as any)
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Add sender info
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg: any) => {
          if (msg.sender_profile_id) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('username, logo')
              .eq('id', msg.sender_profile_id)
              .maybeSingle();

            return {
              ...msg,
              sender_username: senderProfile?.username || 'Anonymous',
              sender_logo: senderProfile?.logo
            };
          }
          return { ...msg, sender_username: 'Anonymous' };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async () => {
    if (!groupId) return;
    
    const { data, error } = await supabase
      .from('group_members')
      .select('profile_id, role, profiles(username, logo)')
      .eq('group_id', groupId);
      
    if (error) {
      console.error('Failed to load members:', error);
      return;
    }
    
    setMembers((data || []).map((m: any) => ({
      profile_id: m.profile_id,
      role: m.role,
      username: m.profiles?.username || 'Unknown',
      logo: m.profiles?.logo
    })));
  };

  const searchUsersToAdd = async (query: string) => {
    if (!query.trim()) {
        setAddMemberResults([]);
        return;
    }
    
    setSearchingMembers(true);
    try {
        // Find users not already in group
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, logo')
            .ilike('username', `%${query}%`)
            .limit(5);
            
        if (error) throw error;
        
        const existingMemberIds = new Set(members.map(m => m.profile_id));
        const filtered = (data || []).filter(p => !existingMemberIds.has(p.id));
        setAddMemberResults(filtered);
    } catch (error) {
        console.error('Search failed:', error);
    } finally {
        setSearchingMembers(false);
    }
  };

  const addMember = async (profileId: string) => {
    try {
        const { error } = await supabase
            .from('group_members')
            .insert({
                group_id: groupId,
                profile_id: profileId,
                role: 'member'
            });
            
        if (error) throw error;
        
        toast.success('Member added');
        setAddMemberQuery('');
        setAddMemberResults([]);
        loadGroupMembers();
    } catch (error) {
        console.error('Failed to add member:', error);
        toast.error('Failed to add member');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this user?')) return;
    
    try {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('profile_id', memberId);
            
        if (error) throw error;
        
        toast.success('Member removed');
        loadGroupMembers();
    } catch (error) {
        console.error('Failed to remove member:', error);
        toast.error('Failed to remove member');
    }
  };

  const leaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('profile_id', myProfileId);
            
        if (error) throw error;
        
        navigate('/inbox');
    } catch (error) {
        console.error('Failed to leave group:', error);
        toast.error('Failed to leave group');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if (isImage && file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    if (isVideo && file.size > 20 * 1024 * 1024) {
      toast.error('Video must be less than 20MB');
      return;
    }
    if (isAudio && file.size > 10 * 1024 * 1024) {
      toast.error('Audio must be less than 10MB');
      return;
    }
    if (!isImage && !isVideo && !isAudio) {
      toast.error('Unsupported file type');
      return;
    }

    setSelectedMedia(file);
    setMediaType(isImage ? 'image' : isVideo ? 'video' : 'audio');
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording not supported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedMedia(file);
        setMediaType('audio');
        setMediaPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Voice record error:', error);
      toast.error('Unable to start recording');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleGroupAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setNewGroupAvatar(file);
    const reader = new FileReader();
    reader.onloadend = () => setNewGroupAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearGroupAvatar = () => {
    setNewGroupAvatar(null);
    setNewGroupAvatarPreview(null);
  };

  const saveGroupUpdates = async () => {
    if (!groupId) return;
    setUpdatingGroup(true);
    try {
      let avatarUrl = group?.avatar_url || null;
      if (newGroupAvatar) {
        const uploaded = await uploadImage(
          newGroupAvatar,
          STORAGE_BUCKETS.PROFILE_IMAGES,
          `groups/${groupId}`
        );
        avatarUrl = uploaded?.url || null;
      }

      const { error } = await supabase
        .from('groups' as any)
        .update({
          avatar_url: avatarUrl,
          theme_color: groupThemeColor,
        })
        .eq('id', groupId);

      if (error) throw error;

      setGroup((prev) => prev ? { ...prev, avatar_url: avatarUrl || prev.avatar_url, theme_color: groupThemeColor } : prev);
      clearGroupAvatar();
      toast.success('Group updated');
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage && !selectedMedia) || !myProfileId || !groupId) return;

    setSending(true);
    try {
      let imageUrl = null;
      let mediaUrl: string | null = null;
      let mediaTypeToSave: string | null = null;

      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadMessageImage(selectedImage);
        } catch (error) {
          console.error('Failed to upload image:', error);
          toast.error('Failed to upload image');
          setUploadingImage(false);
          setSending(false);
          return;
        }
        setUploadingImage(false);
      }

      if (selectedMedia) {
        setUploadingImage(true);
        try {
          const uploaded = await uploadMessageMedia(selectedMedia, `group/${groupId}`);
          mediaUrl = uploaded?.url || null;
          mediaTypeToSave = mediaType;
        } catch (error) {
          console.error('Failed to upload media:', error);
          toast.error('Failed to upload media');
          setUploadingImage(false);
          setSending(false);
          return;
        }
        setUploadingImage(false);
      }

      const { error } = await supabase
        .from('messages' as any)
        .insert({
          sender_profile_id: myProfileId,
          group_id: groupId,
          content: newMessage.trim(),
          image_url: imageUrl || (mediaTypeToSave === 'image' ? mediaUrl : null),
          media_url: mediaUrl,
          media_type: mediaTypeToSave,
          is_read: false // Not really used for groups in same way
        });

      if (error) throw error;

      setNewMessage('');
      clearImage();
      clearMedia();
      await loadMessages();
      toast.success('Message sent!');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/40">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 mr-2"
          onClick={() => navigate('/inbox')}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={group?.avatar_url} />
            <AvatarFallback>
              <Users className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">
              {group?.name || 'Group Chat'}
            </span>
            <span className="text-xs text-muted-foreground">
              {group?.description || 'Group conversation'}
            </span>
          </div>
        </div>

        <Dialog open={isGroupInfoOpen} onOpenChange={setIsGroupInfoOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Group Info</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={newGroupAvatarPreview || group?.avatar_url} />
                            <AvatarFallback><Users className="h-8 w-8" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold text-lg">{group?.name}</h3>
                            <p className="text-sm text-muted-foreground">{group?.description || 'No description'}</p>
                            <p className="text-xs text-muted-foreground mt-1">{members.length} members</p>
                        </div>
                    </div>

                    {group?.created_by === myProfileId && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Group Profile</h4>
                        <Input type="file" accept="image/*" onChange={handleGroupAvatarSelect} />
                        {newGroupAvatarPreview && (
                          <Button variant="outline" size="sm" onClick={clearGroupAvatar}>
                            Clear image
                          </Button>
                        )}
                        <div className="space-y-2 pt-2">
                          <Label htmlFor="group-theme-color">Theme Color</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="group-theme-color"
                              type="color"
                              value={groupThemeColor}
                              onChange={(e) => setGroupThemeColor(e.target.value)}
                              className="h-10 w-16 p-1"
                            />
                            <span className="text-xs text-muted-foreground">Applies to chat accents and bubbles.</span>
                          </div>
                        </div>
                        <Button
                          onClick={saveGroupUpdates}
                          disabled={updatingGroup}
                          className="w-full"
                        >
                          {updatingGroup ? 'Saving...' : 'Save changes'}
                        </Button>
                      </div>
                    )}

                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Members</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {members.map(member => (
                                <div key={member.profile_id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.logo} />
                                            <AvatarFallback>{member.username[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {member.username}
                                                {member.profile_id === myProfileId && ' (You)'}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                        </div>
                                    </div>
                                    {group?.created_by === myProfileId && member.profile_id !== myProfileId && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMember(member.profile_id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Add Member</Label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Search username..." 
                                value={addMemberQuery}
                                onChange={(e) => {
                                    setAddMemberQuery(e.target.value);
                                    searchUsersToAdd(e.target.value);
                                }}
                            />
                        </div>
                        {addMemberResults.length > 0 && (
                            <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                                {addMemberResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.logo} />
                                                <AvatarFallback>{user.username[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm">{user.username}</span>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => addMember(user.id)}>
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t">
                        <Button variant="destructive" className="w-full gap-2" onClick={leaveGroup}>
                            <LogOut className="h-4 w-4" />
                            Leave Group
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={group?.avatar_url} />
              <AvatarFallback className="text-4xl">
                <Users className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-xl">{group?.name}</h3>
              <p className="text-muted-foreground">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMyMessage = message.sender_profile_id === myProfileId;
            const showAvatar = !isMyMessage && (index === messages.length - 1 || messages[index + 1]?.sender_profile_id === myProfileId);
            const showSenderName = !isMyMessage && (index === 0 || messages[index - 1]?.sender_profile_id !== message.sender_profile_id);
            
            return (
              <div
                key={message.id}
                className={`flex w-full ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end max-w-[70%] gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                   {!isMyMessage && (
                     <div className="w-7 flex-shrink-0 flex flex-col items-center">
                       {showAvatar && (
                         <Avatar className="h-7 w-7">
                           <AvatarImage src={message.sender_logo} />
                           <AvatarFallback className="text-[10px]">
                             {message.sender_username?.[0]?.toUpperCase() || '?'}
                           </AvatarFallback>
                         </Avatar>
                       )}
                     </div>
                   )}

                   <div className="flex flex-col">
                    {!isMyMessage && showSenderName && (
                        <span className="text-[10px] text-muted-foreground ml-1 mb-1">
                            {message.sender_username}
                        </span>
                    )}
                    <div
                        className={`px-4 py-2 relative group ${
                        isMyMessage
                            ? 'text-white rounded-2xl rounded-br-sm'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-foreground rounded-2xl rounded-bl-sm'
                        }`}
                        style={isMyMessage ? { backgroundColor: groupThemeColor } : undefined}
                    >
                    {message.content && (
                    <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                    </p>
                    )}
                    {(message.image_url || (message.media_type === 'image' && message.media_url)) && (
                    <div className={`${message.content ? 'mt-2' : ''}`}>
                        <img
                        src={message.image_url || message.media_url || ''}
                        alt="Shared image"
                        className="rounded-lg max-h-64 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(message.image_url || message.media_url || '', '_blank')}
                        />
                    </div>
                    )}
                    {message.media_type === 'video' && message.media_url && (
                      <div className={`${message.content ? 'mt-2' : ''}`}>
                        <video
                          src={message.media_url}
                          controls
                          className="rounded-lg max-h-64 w-full"
                        />
                      </div>
                    )}
                    {message.media_type === 'audio' && message.media_url && (
                      <div className={`${message.content ? 'mt-2' : ''}`}>
                        <audio src={message.media_url} controls className="w-full" />
                      </div>
                    )}
                </div>
                   </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-full px-1 py-1 pr-2 border border-border/50">
           <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploadingImage}
            >
              <div className="rounded-full p-1" style={{ backgroundColor: groupThemeColor }}>
                 <svg aria-label="Camera" className="x1lliihq x1n2onr6 x5n08af" fill="white" height="16" role="img" viewBox="0 0 24 24" width="16"><path d="M8.119 2.75a2.75 2.75 0 0 1 2.525-1.748h2.712a2.75 2.75 0 0 1 2.525 1.748l1.042 2.72a.75.75 0 0 0 .702.48h2.625A2.75 2.75 0 0 1 23 8.7v9.55A2.75 2.75 0 0 1 20.25 21H3.75A2.75 2.75 0 0 1 1 18.25V8.7a2.75 2.75 0 0 1 2.75-2.75h2.625a.75.75 0 0 0 .702-.48l1.042-2.72ZM12 7a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"></path></svg>
              </div>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20"
              onClick={() => mediaInputRef.current?.click()}
              disabled={sending || uploadingImage}
            >
              <Video className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full ${recording ? 'text-red-600 bg-red-500/20' : 'text-emerald-500 bg-emerald-500/10'} hover:bg-emerald-500/20`}
              onClick={() => (recording ? stopRecording() : startRecording())}
              disabled={sending || uploadingImage}
            >
              <Mic className="w-4 h-4" />
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={handleMediaSelect}
            />

            {imagePreview && (
            <div className="relative inline-block h-8 w-8 ml-1">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-8 w-8 rounded object-cover border"
              />
              <button
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                onClick={clearImage}
              >
                <X className="h-2 w-2" />
              </button>
            </div>
            )}

            {mediaPreview && (
              <div className="relative inline-block h-8 w-8 ml-1">
                {mediaType === 'video' ? (
                  <div className="h-8 w-8 rounded border bg-slate-100 flex items-center justify-center">
                    <Video className="w-4 h-4 text-slate-500" />
                  </div>
                ) : mediaType === 'audio' ? (
                  <div className="h-8 w-8 rounded border bg-slate-100 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-slate-500" />
                  </div>
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="h-8 w-8 rounded object-cover border"
                  />
                )}
                <button
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  onClick={clearMedia}
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            )}

            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              disabled={sending || uploadingImage}
              className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 h-9 px-2"
            />
            
            {newMessage.trim() || selectedImage || selectedMedia ? (
                <Button
                  onClick={sendMessage}
                  disabled={sending || uploadingImage}
                  variant="ghost"
                  className="h-auto px-3 font-semibold hover:bg-transparent"
                  style={{ color: groupThemeColor }}
                >
                  Send
                </Button>
            ) : null}
        </div>
      </div>
    </div>
  );
}
