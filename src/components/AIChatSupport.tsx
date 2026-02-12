import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Settings, 
  Palette, 
  Minimize2, 
  Maximize2,
  Download,
  Copy,
  RefreshCw,
  Zap,
  Sparkles,
  Heart,
  Star,
  Moon,
  Sun,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'text' | 'image' | 'link' | 'suggestion';
  metadata?: {
    confidence?: number;
    source?: string;
    actions?: Array<{
      label: string;
      action: string;
      url?: string;
    }>;
  };
}

interface ChatbotDesign {
  // Position & Size
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  size: 'small' | 'medium' | 'large';
  
  // Colors
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  botMessageColor: string;
  userMessageColor: string;
  
  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  
  // Styling
  borderRadius: number;
  shadow: 'none' | 'small' | 'medium' | 'large';
  animation: 'none' | 'pulse' | 'bounce' | 'glow' | 'shake';
  
  // Branding
  botName: string;
  welcomeMessage: string;
  botAvatar?: string;
  showBranding: boolean;
  customCSS?: string;
  
  // Behavior
  autoOpen: boolean;
  soundEnabled: boolean;
  typingIndicator: boolean;
  showTimestamps: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface AIChatSupportProps {
  profileId?: string;
  initialDesign?: Partial<ChatbotDesign>;
  onDesignUpdate?: (design: ChatbotDesign) => void;
}

export const AIChatSupport: React.FC<AIChatSupportProps> = ({
  profileId,
  initialDesign,
  onDesignUpdate
}) => {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Design state
  const [design, setDesign] = useState<ChatbotDesign>({
    position: 'bottom-right',
    size: 'medium',
    primaryColor: '#3b82f6',
    secondaryColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    botMessageColor: '#f3f4f6',
    userMessageColor: '#3b82f6',
    fontFamily: 'system-ui',
    fontSize: 14,
    fontWeight: 'normal',
    borderRadius: 12,
    shadow: 'medium',
    animation: 'none',
    botName: 'Assistant',
    welcomeMessage: 'Hi! How can I help you today?',
    showBranding: true,
    autoOpen: false,
    soundEnabled: true,
    typingIndicator: true,
    showTimestamps: false,
    theme: 'auto',
    ...initialDesign
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && design.welcomeMessage) {
      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        content: design.welcomeMessage,
        isBot: true,
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMsg]);
    }
  }, [design.welcomeMessage]);

  // Simulate AI response
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simple response logic (in production, this would call a real AI API)
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello! I'm ${design.botName}, your AI assistant. How can I help you today?`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! You can ask me about:\n• Link shortening and QR codes\n• Profile customization\n• Premium features\n• Technical support\n\nWhat would you like to know?";
    }
    
    if (lowerMessage.includes('link') || lowerMessage.includes('shorten')) {
      return "I can help you create shortened links! Simply paste your long URL, and I'll generate a short, shareable link with a QR code. You can also customize the appearance and add thumbnails. Would you like me to guide you through the process?";
    }
    
    if (lowerMessage.includes('qr') || lowerMessage.includes('code')) {
      return "QR codes are automatically generated for all your shortened links! You can download them in high quality, customize their appearance, and use them in your marketing materials. Would you like tips on QR code best practices?";
    }
    
    if (lowerMessage.includes('premium') || lowerMessage.includes('upgrade')) {
      return "Our Premium plan includes:\n• Custom domains\n• Advanced analytics\n• Bulk link creation\n• API access\n• Priority support\n\nWould you like to learn more about upgrading?";
    }

    // Default response
    return `I understand you're asking about "${userMessage}". While I'm learning to better assist you, you can try rephrasing your question or contact our human support team for more detailed help. Is there anything specific I can help you with?`;
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      content: inputMessage,
      isBot: false,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Play sound if enabled
    if (design.soundEnabled) {
      // You can add actual sound here
    }

    try {
      const aiResponse = await generateAIResponse(inputMessage);
      
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        content: aiResponse,
        isBot: true,
        timestamp: new Date(),
        type: 'text',
        metadata: {
          confidence: 0.85 + Math.random() * 0.15
        }
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('AI response error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Update design
  const updateDesign = (updates: Partial<ChatbotDesign>) => {
    const newDesign = { ...design, ...updates };
    setDesign(newDesign);
    onDesignUpdate?.(newDesign);
  };

  // Copy chat transcript
  const copyTranscript = () => {
    const transcript = messages
      .map(msg => `${msg.isBot ? design.botName : 'You'}: ${msg.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(transcript);
    toast.success('Chat transcript copied!');
  };

  // Clear chat
  const clearChat = () => {
    setMessages([{
      id: 'welcome_new',
      content: design.welcomeMessage,
      isBot: true,
      timestamp: new Date(),
      type: 'text'
    }]);
    toast.success('Chat cleared');
  };

  // Get position styles
  const getPositionStyles = () => {
    const positions = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'top-left': { top: '20px', left: '20px' },
      'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    };
    return positions[design.position];
  };

  // Get size styles
  const getSizeStyles = () => {
    const sizes = {
      small: { width: '320px', height: '400px' },
      medium: { width: '380px', height: '500px' },
      large: { width: '450px', height: '600px' }
    };
    return sizes[design.size];
  };

  // Chat button (when closed)
  if (!isOpen) {
    return (
      <div
        className="fixed z-50 cursor-pointer"
        style={{
          ...getPositionStyles(),
          animation: design.animation === 'bounce' ? 'bounce 2s infinite' :
                   design.animation === 'pulse' ? 'pulse 2s infinite' :
                   design.animation === 'glow' ? 'glow 2s infinite' :
                   design.animation === 'shake' ? 'shake 0.5s infinite' : 'none'
        }}
        onClick={() => setIsOpen(true)}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
          style={{
            backgroundColor: design.primaryColor,
            boxShadow: design.shadow === 'large' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' :
                      design.shadow === 'medium' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' :
                      design.shadow === 'small' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          <MessageCircle className="w-6 h-6" />
        </div>
        
        {design.animation === 'pulse' && (
          <div 
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping"
            style={{ backgroundColor: design.secondaryColor }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed z-50" style={getPositionStyles()}>
      <Card
        className="overflow-hidden"
        style={{
          ...getSizeStyles(),
          borderRadius: `${design.borderRadius}px`,
          backgroundColor: design.backgroundColor,
          color: design.textColor,
          fontFamily: design.fontFamily,
          fontSize: `${design.fontSize}px`,
          fontWeight: design.fontWeight,
          boxShadow: design.shadow === 'large' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' :
                    design.shadow === 'medium' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' :
                    design.shadow === 'small' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none'
        }}
      >
        {/* Header */}
        <CardHeader 
          className="pb-2"
          style={{ 
            backgroundColor: design.primaryColor,
            color: '#ffffff'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                {design.botAvatar ? (
                  <img src={design.botAvatar} alt="Bot" className="w-6 h-6 rounded-full" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{design.botName}</h3>
                <p className="text-xs opacity-80">AI Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b bg-muted/50">
            <Tabs defaultValue="appearance">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="appearance">Style</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="appearance" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Primary Color</Label>
                    <Input
                      type="color"
                      value={design.primaryColor}
                      onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                      className="w-full h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Background</Label>
                    <Input
                      type="color"
                      value={design.backgroundColor}
                      onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                      className="w-full h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Size</Label>
                  <Select 
                    value={design.size} 
                    onValueChange={(value: 'small' | 'medium' | 'large') => updateDesign({ size: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (320px)</SelectItem>
                      <SelectItem value="medium">Medium (380px)</SelectItem>
                      <SelectItem value="large">Large (450px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Animation</Label>
                  <Select 
                    value={design.animation} 
                    onValueChange={(value: 'none' | 'pulse' | 'bounce' | 'glow' | 'shake') => updateDesign({ animation: value })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="pulse">Pulse</SelectItem>
                      <SelectItem value="bounce">Bounce</SelectItem>
                      <SelectItem value="glow">Glow</SelectItem>
                      <SelectItem value="shake">Shake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Sound Effects</Label>
                  <Switch
                    checked={design.soundEnabled}
                    onCheckedChange={(checked) => updateDesign({ soundEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Typing Indicator</Label>
                  <Switch
                    checked={design.typingIndicator}
                    onCheckedChange={(checked) => updateDesign({ typingIndicator: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Timestamps</Label>
                  <Switch
                    checked={design.showTimestamps}
                    onCheckedChange={(checked) => updateDesign({ showTimestamps: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Welcome Message</Label>
                  <Textarea
                    value={design.welcomeMessage}
                    onChange={(e) => updateDesign({ welcomeMessage: e.target.value })}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Bot Name</Label>
                  <Input
                    value={design.botName}
                    onChange={(e) => updateDesign({ botName: e.target.value })}
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Border Radius</Label>
                  <Slider
                    value={[design.borderRadius]}
                    onValueChange={(value) => updateDesign({ borderRadius: value[0] })}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyTranscript}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Chat
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearChat}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Chat Messages */}
        {!isMinimized && (
          <>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100% - 140px)' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {message.isBot && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot ? 'bg-muted' : ''
                    }`}
                    style={!message.isBot ? {
                      backgroundColor: design.userMessageColor,
                      color: '#ffffff'
                    } : {
                      backgroundColor: design.botMessageColor
                    }}
                  >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    
                    {design.showTimestamps && (
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    )}
                    
                    {message.metadata?.confidence && (
                      <div className="text-xs opacity-70 mt-1">
                        Confidence: {Math.round(message.metadata.confidence * 100)}%
                      </div>
                    )}
                  </div>
                  
                  {!message.isBot && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && design.typingIndicator && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  size="sm"
                  style={{ backgroundColor: design.primaryColor }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Branding */}
        {design.showBranding && (
          <div className="px-4 py-2 text-center border-t">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-primary font-medium">DropLink AI</span>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};