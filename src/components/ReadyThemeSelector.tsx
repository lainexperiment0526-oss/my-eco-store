import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Video, 
  Code, 
  TrendingUp, 
  Gamepad2, 
  Bitcoin, 
  Music, 
  Camera, 
  Palette, 
  Heart,
  Zap,
  Star
} from "lucide-react";

interface ReadyTheme {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  primaryColor: string;
  backgroundColor: string;
  backgroundType: 'color' | 'gif';
  backgroundGif: string;
  iconStyle: 'rounded' | 'circle' | 'square';
  buttonStyle: 'filled' | 'outline' | 'glass';
  preview: string;
  popular?: boolean;
  new?: boolean;
  // Template content
  templateData: {
    businessName: string;
    description: string;
    customLinks: Array<{
      id: string;
      title: string;
      url: string;
      icon: string;
    }>;
    socialLinks: {
      twitter: string;
      instagram: string;
      youtube: string;
      tiktok: string;
      facebook: string;
      linkedin: string;
      website: string;
    };
  };
}

const readyThemes: ReadyTheme[] = [
  // Business Themes
  {
    id: 'corporate-blue',
    name: 'Corporate Professional',
    category: 'Business',
    description: 'Clean, professional look for corporate professionals and consultants',
    icon: Briefcase,
    primaryColor: '#e0e7ff', // Blue-tinted for business/corporate
    backgroundColor: '#2563eb', // Brighter blue for better contrast
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'filled',
    preview: 'Blue & white professional theme',
    popular: true,
    templateData: {
      businessName: 'Professional Services',
      description: 'Building business excellence through strategic consulting and innovative solutions. Trusted by Fortune 500 companies.',
      customLinks: [
        { id: '1', title: 'Book Consultation', url: 'https://calendly.com/yourname', icon: '📅' },
        { id: '2', title: 'Services & Pricing', url: 'https://yourwebsite.com/services', icon: '💼' },
        { id: '3', title: 'Client Testimonials', url: 'https://yourwebsite.com/testimonials', icon: '⭐' },
        { id: '4', title: 'Case Studies', url: 'https://yourwebsite.com/portfolio', icon: '📊' },
        { id: '5', title: 'Contact & Support', url: 'mailto:hello@yourcompany.com', icon: '📧' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourcompany',
        instagram: '',
        youtube: '',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/company/yourcompany',
        website: 'https://yourwebsite.com'
      }
    }
  },
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    category: 'Business',
    description: 'Sophisticated dark theme for executives and business leaders',
    icon: Briefcase,
    primaryColor: '#23272f', // Deep slate for luxury dark
    backgroundColor: '#ffd700', // True gold for luxury
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'square',
    buttonStyle: 'filled', // Gold looks better filled on dark
    preview: 'Dark theme with gold accents',
    templateData: {
      businessName: 'Executive Leadership',
      description: 'Senior executive focused on strategic growth, innovation, and market leadership. Driving organizational excellence and sustainable business transformation.',
      customLinks: [
        { id: '1', title: 'Executive Calendar', url: 'https://calendly.com/exec', icon: '🗓️' },
        { id: '2', title: 'Leadership Blog', url: 'https://yourblog.com', icon: '📝' },
        { id: '3', title: 'Board Presentations', url: 'https://board.yourcompany.com', icon: '📊' },
        { id: '4', title: 'Industry Insights', url: 'https://insights.yourcompany.com', icon: '💡' },
        { id: '5', title: 'Executive Assistant', url: 'mailto:assistant@yourcompany.com', icon: '📧' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourhandle',
        instagram: '',
        youtube: '',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/in/yourprofile',
        website: 'https://yourcompany.com'
      }
    }
  },
  {
    id: 'startup-gradient',
    name: 'Startup Vibe',
    category: 'Business',
    description: 'Modern gradient theme perfect for startups and innovation',
    icon: TrendingUp,
    primaryColor: '#ede9fe', // Gradient purple base
    backgroundColor: '#a21caf', // Vibrant purple for energy
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'glass',
    preview: 'Purple gradient theme',
    templateData: {
      businessName: 'Innovative Startup',
      description: 'Revolutionary startup transforming industries through cutting-edge technology and disruptive innovation. Join us in building the future.',
      customLinks: [
        { id: '1', title: 'Pitch Deck', url: 'https://pitch.yourstartup.com', icon: '🚀' },
        { id: '2', title: 'Product Demo', url: 'https://demo.yourstartup.com', icon: '💻' },
        { id: '3', title: 'Join Our Team', url: 'https://careers.yourstartup.com', icon: '👥' },
        { id: '4', title: 'Investor Relations', url: 'mailto:investors@yourstartup.com', icon: '💰' },
        { id: '5', title: 'Product Roadmap', url: 'https://roadmap.yourstartup.com', icon: '🗺️' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourstartup',
        instagram: 'https://instagram.com/yourstartup',
        youtube: '',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/company/yourstartup',
        website: 'https://yourstartup.com'
      }
    }
  },

  // Creator Themes
  {
    id: 'content-creator',
    name: 'Content Creator',
    category: 'Creators',
    description: 'Vibrant theme designed for YouTubers and content creators',
    icon: Video,
    primaryColor: '#fee2e2', // YouTube red/pinkish
    backgroundColor: '#dc2626', // Softer red for less eye strain
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'filled',
    preview: 'YouTube red theme for creators',
    popular: true,
    templateData: {
      businessName: 'Creative Studio',
      description: 'Creating engaging content that inspires, educates, and entertains. Join our community of passionate creators and explore amazing content.',
      customLinks: [
        { id: '1', title: 'Latest Video', url: 'https://youtube.com/yourchannel', icon: '🎬' },
        { id: '2', title: 'Patreon Support', url: 'https://patreon.com/yourcreator', icon: '❤️' },
        { id: '3', title: 'Discord Community', url: 'https://discord.gg/yourcommunity', icon: '💬' },
        { id: '4', title: 'Merchandise Store', url: 'https://merch.yourstore.com', icon: '🛍️' },
        { id: '5', title: 'Creator Collab', url: 'mailto:collab@yourcreator.com', icon: '🤝' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourcreator',
        instagram: 'https://instagram.com/yourcreator',
        youtube: 'https://youtube.com/yourchannel',
        tiktok: 'https://tiktok.com/@yourcreator',
        facebook: '',
        linkedin: '',
        website: 'https://yourcreator.com'
      }
    }
  },
  {
    id: 'artistic-purple',
    name: 'Artistic Vision',
    category: 'Creators',
    description: 'Creative purple theme for artists and designers',
    icon: Palette,
    primaryColor: '#ede9fe', // Artistic purple base
    backgroundColor: '#a78bfa', // Softer purple for harmony
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'filled', // More visual pop for artists
    preview: 'Purple artistic theme',
    templateData: {
      businessName: 'Artistic Vision Studio',
      description: 'Bringing imagination to life through digital art, design, and visual storytelling. Creating unique artistic experiences that inspire and captivate.',
      customLinks: [
        { id: '1', title: 'Art Portfolio', url: 'https://portfolio.yourart.com', icon: '🎨' },
        { id: '2', title: 'Commission Work', url: 'https://commissions.yourart.com', icon: '💼' },
        { id: '3', title: 'Art Prints Shop', url: 'https://shop.yourart.com', icon: '🛍️' },
        { id: '4', title: 'Digital Gallery', url: 'https://gallery.yourart.com', icon: '🖼️' },
        { id: '5', title: 'Contact Artist', url: 'mailto:hello@yourart.com', icon: '✉️' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourart',
        instagram: 'https://instagram.com/yourart',
        youtube: '',
        tiktok: 'https://tiktok.com/@yourart',
        facebook: '',
        linkedin: '',
        website: 'https://yourart.com'
      }
    }
  },
  {
    id: 'photographer',
    name: 'Photography Pro',
    category: 'Creators',
    description: 'Elegant black & white theme for photographers',
    icon: Camera,
    primaryColor: '#111827', // Elegant deep gray/black
    backgroundColor: '#fbbf24', // Softer gold for elegance
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'square',
    buttonStyle: 'outline', // Gold outline for elegance
    preview: 'Black theme with golden accents',
    templateData: {
      businessName: 'Photography Pro Studio',
      description: 'Capturing life\'s precious moments with artistic excellence. Professional photography services for weddings, portraits, and commercial projects.',
      customLinks: [
        { id: '1', title: 'Photography Portfolio', url: 'https://portfolio.yourphotography.com', icon: '📷' },
        { id: '2', title: 'Book a Session', url: 'https://booking.yourphotography.com', icon: '📅' },
        { id: '3', title: 'Wedding Gallery', url: 'https://weddings.yourphotography.com', icon: '💒' },
        { id: '4', title: 'Pricing & Packages', url: 'https://pricing.yourphotography.com', icon: '💰' },
        { id: '5', title: 'Client Gallery Access', url: 'https://gallery.yourphotography.com', icon: '🔐' }
      ],
      socialLinks: {
        twitter: '',
        instagram: 'https://instagram.com/yourphotography',
        youtube: 'https://youtube.com/yourphotography',
        tiktok: '',
        facebook: 'https://facebook.com/yourphotography',
        linkedin: '',
        website: 'https://yourphotography.com'
      }
    }
  },
  {
    id: 'musician',
    name: 'Music Maestro',
    category: 'Creators',
    description: 'Dynamic theme for musicians',
    icon: Music,
    primaryColor: '#0c0a09', // Music dark for animation
    backgroundColor: '#f472b6', // Lighter pink for vibrance
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'circle',
    buttonStyle: 'glass',
    preview: 'Pink music theme',
    templateData: {
      businessName: 'Music Maestro',
      description: 'Creating soulful music that touches hearts and moves spirits. Original compositions, live performances, and musical collaborations.',
      customLinks: [
        { id: '1', title: 'Latest Album', url: 'https://spotify.com/yourmusic', icon: '🎵' },
        { id: '2', title: 'Live Performances', url: 'https://concerts.yourmusic.com', icon: '🎤' },
        { id: '3', title: 'Music Videos', url: 'https://youtube.com/yourmusic', icon: '🎬' },
        { id: '4', title: 'Fan Club', url: 'https://fanclub.yourmusic.com', icon: '👥' },
        { id: '5', title: 'Book Performance', url: 'mailto:booking@yourmusic.com', icon: '📧' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourmusic',
        instagram: 'https://instagram.com/yourmusic',
        youtube: 'https://youtube.com/yourmusic',
        tiktok: 'https://tiktok.com/@yourmusic',
        facebook: 'https://facebook.com/yourmusic',
        linkedin: '',
        website: 'https://yourmusic.com'
      }
    }
  },

  // Developer Themes
  {
    id: 'developer-matrix',
    name: 'Matrix Developer',
    category: 'Developer',
    description: 'Green matrix-style theme for developers and coders',
    icon: Code,
    primaryColor: '#0a192f', // Matrix blue-black
    backgroundColor: '#22d3ee', // Neon cyan for matrix effect
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'square',
    buttonStyle: 'filled',
    preview: 'Green on black developer theme',
    popular: true,
    templateData: {
      businessName: 'Matrix Developer',
      description: 'Full-stack developer passionate about clean code, innovative solutions, and cutting-edge technologies. Building the digital future one line at a time.',
      customLinks: [
        { id: '1', title: 'GitHub Portfolio', url: 'https://github.com/yourusername', icon: '💻' },
        { id: '2', title: 'Tech Blog', url: 'https://blog.yourdev.com', icon: '📝' },
        { id: '3', title: 'Open Source Projects', url: 'https://projects.yourdev.com', icon: '🔧' },
        { id: '4', title: 'Code Snippets', url: 'https://snippets.yourdev.com', icon: '📋' },
        { id: '5', title: 'Contact Developer', url: 'mailto:hello@yourdev.com', icon: '📧' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourdev',
        instagram: '',
        youtube: 'https://youtube.com/yourdev',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/in/yourdev',
        website: 'https://yourdev.com'
      }
    }
  },
  {
    id: 'tech-minimalist',
    name: 'Tech Minimalist',
    category: 'Developer',
    description: 'Clean minimalist theme for tech professionals',
    icon: Code,
    primaryColor: '#f1f5f9', // Minimalist blue/white
    backgroundColor: '#2563eb', // Brighter blue for clarity
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'outline',
    preview: 'Clean blue & white tech theme',
    templateData: {
      businessName: 'Tech Minimalist',
      description: 'Crafting elegant, user-focused digital experiences through minimalist design and robust engineering. Simplicity meets functionality.',
      customLinks: [
        { id: '1', title: 'Portfolio Showcase', url: 'https://portfolio.yourtech.com', icon: '🚀' },
        { id: '2', title: 'Technical Articles', url: 'https://articles.yourtech.com', icon: '📚' },
        { id: '3', title: 'API Documentation', url: 'https://docs.yourtech.com', icon: '📖' },
        { id: '4', title: 'Code Reviews', url: 'https://reviews.yourtech.com', icon: '🔍' },
        { id: '5', title: 'Hire Me', url: 'https://hire.yourtech.com', icon: '💼' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/yourtech',
        instagram: '',
        youtube: '',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/in/yourtech',
        website: 'https://yourtech.com'
      }
    }
  },
  {
    id: 'cyberpunk-dev',
    name: 'Cyberpunk Code',
    category: 'Developer',
    description: 'Futuristic cyberpunk theme with neon effects',
    icon: Code,
    primaryColor: '#06ffa5',
    backgroundColor: '#0a0118',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'square',
    buttonStyle: 'glass',
    preview: 'Cyberpunk neon theme',
    new: true,
    templateData: {
      businessName: 'Cyberpunk Coder',
      description: 'Hacking the future with bleeding-edge code and cybernetic precision. Building tomorrow\'s digital infrastructure with neon-powered innovation.',
      customLinks: [
        { id: '1', title: 'Neural Networks', url: 'https://neural.cyberpunk.dev', icon: '🧠' },
        { id: '2', title: 'Blockchain Projects', url: 'https://blockchain.cyberpunk.dev', icon: '⛓️' },
        { id: '3', title: 'AI Experiments', url: 'https://ai.cyberpunk.dev', icon: '🤖' },
        { id: '4', title: 'Quantum Code', url: 'https://quantum.cyberpunk.dev', icon: '⚛️' },
        { id: '5', title: 'Matrix Contact', url: 'mailto:neo@cyberpunk.dev', icon: '💊' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/cyberpunkdev',
        instagram: '',
        youtube: 'https://youtube.com/cyberpunkdev',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/in/cyberpunkdev',
        website: 'https://cyberpunk.dev'
      }
    }
  },

  // Entrepreneur Themes
  {
    id: 'entrepreneur-gold',
    name: 'Golden Success',
    category: 'Entrepreneur',
    description: 'Luxurious gold theme for successful entrepreneurs',
    icon: TrendingUp,
    primaryColor: '#fef3c7', // Gold/yellow for entrepreneur
    backgroundColor: '#f59e0b',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'filled',
    preview: 'Dark theme with gold highlights',
    templateData: {
      businessName: 'Golden Success Ventures',
      description: 'Transforming ambitious visions into profitable realities. Serial entrepreneur with a proven track record of building million-dollar businesses.',
      customLinks: [
        { id: '1', title: 'Success Story', url: 'https://story.goldensuccess.com', icon: '👑' },
        { id: '2', title: 'Business Mentoring', url: 'https://mentoring.goldensuccess.com', icon: '🎯' },
        { id: '3', title: 'Investment Portfolio', url: 'https://portfolio.goldensuccess.com', icon: '💰' },
        { id: '4', title: 'Speaking Events', url: 'https://events.goldensuccess.com', icon: '🎤' },
        { id: '5', title: 'Partner With Me', url: 'mailto:partners@goldensuccess.com', icon: '🤝' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/goldensuccess',
        instagram: 'https://instagram.com/goldensuccess',
        youtube: 'https://youtube.com/goldensuccess',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/in/goldensuccess',
        website: 'https://goldensuccess.com'
      }
    }
  },
  {
    id: 'innovator',
    name: 'Innovation Hub',
    category: 'Entrepreneur',
    description: 'Modern theme for innovators and visionaries',
    icon: Zap,
    primaryColor: '#e0f2fe', // Light blue for innovation
    backgroundColor: '#06b6d4',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'circle',
    buttonStyle: 'outline',
    preview: 'Light blue innovation theme',
    templateData: {
      businessName: 'Innovation Hub',
      description: 'Pioneering breakthrough innovations that reshape industries and create lasting impact. Where visionary ideas meet strategic execution.',
      customLinks: [
        { id: '1', title: 'Innovation Lab', url: 'https://lab.innovationhub.com', icon: '🔬' },
        { id: '2', title: 'Research Papers', url: 'https://research.innovationhub.com', icon: '📊' },
        { id: '3', title: 'Startup Incubator', url: 'https://incubator.innovationhub.com', icon: '🚀' },
        { id: '4', title: 'Innovation Challenges', url: 'https://challenges.innovationhub.com', icon: '💡' },
        { id: '5', title: 'Collaborate', url: 'mailto:collab@innovationhub.com', icon: '🤝' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/innovationhub',
        instagram: '',
        youtube: 'https://youtube.com/innovationhub',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/company/innovationhub',
        website: 'https://innovationhub.com'
      }
    }
  },

  // Gaming Themes
  {
    id: 'gamer-neon',
    name: 'Neon Gaming',
    category: 'Gaming',
    description: 'Electric neon theme perfect for gamers and streamers',
    icon: Gamepad2,
    primaryColor: '#1e1b4b', // Neon purple for gaming
    backgroundColor: '#a855f7',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'filled',
    preview: 'Purple neon gaming theme',
    popular: true,
    templateData: {
      businessName: 'Neon Gaming Arena',
      description: 'Elite gamer and content creator bringing you epic gameplay, tutorials, and gaming entertainment. Join the neon revolution!',
      customLinks: [
        { id: '1', title: 'Twitch Stream', url: 'https://twitch.tv/neongamer', icon: '🎮' },
        { id: '2', title: 'Gaming Setup', url: 'https://setup.neongaming.com', icon: '⚡' },
        { id: '3', title: 'Discord Community', url: 'https://discord.gg/neongaming', icon: '💬' },
        { id: '4', title: 'Gaming Tutorials', url: 'https://tutorials.neongaming.com', icon: '🎯' },
        { id: '5', title: 'Sponsor Inquiry', url: 'mailto:sponsor@neongaming.com', icon: '💜' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/neongamer',
        instagram: 'https://instagram.com/neongamer',
        youtube: 'https://youtube.com/neongamer',
        tiktok: 'https://tiktok.com/@neongamer',
        facebook: '',
        linkedin: '',
        website: 'https://neongaming.com'
      }
    }
  },
  {
    id: 'retro-gaming',
    name: 'Retro Arcade',
    category: 'Gaming',
    description: 'Nostalgic retro theme inspired by classic arcade games',
    icon: Gamepad2,
    primaryColor: '#f97316',
    backgroundColor: '#1c1917',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'square',
    buttonStyle: 'filled',
    preview: 'Orange retro gaming theme',
    templateData: {
      businessName: 'Retro Arcade Masters',
      description: 'Celebrating the golden age of gaming with classic arcade gameplay, retro reviews, and nostalgic content. Level up your retro gaming experience!',
      customLinks: [
        { id: '1', title: 'Arcade Collection', url: 'https://arcade.retrogaming.com', icon: '🕹️' },
        { id: '2', title: 'Retro Reviews', url: 'https://reviews.retrogaming.com', icon: '🎲' },
        { id: '3', title: 'High Score Board', url: 'https://scores.retrogaming.com', icon: '🏆' },
        { id: '4', title: 'Gaming History', url: 'https://history.retrogaming.com', icon: '📚' },
        { id: '5', title: 'Retro Merchandise', url: 'https://shop.retrogaming.com', icon: '🛍️' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/retrogaming',
        instagram: 'https://instagram.com/retrogaming',
        youtube: 'https://youtube.com/retrogaming',
        tiktok: 'https://tiktok.com/@retrogaming',
        facebook: 'https://facebook.com/retrogaming',
        linkedin: '',
        website: 'https://retrogaming.com'
      }
    }
  },
  {
    id: 'esports-pro',
    name: 'eSports Pro',
    category: 'Gaming',
    description: 'Professional esports theme',
    icon: Gamepad2,
    primaryColor: '#ef4444',
    backgroundColor: '#0c0a09',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'circle',
    buttonStyle: 'glass',
    preview: 'Red esports theme',
    new: true,
    templateData: {
      businessName: 'eSports Pro Team',
      description: 'Professional eSports athlete competing at the highest level. Training, competing, and inspiring the next generation of gaming champions.',
      customLinks: [
        { id: '1', title: 'Tournament Schedule', url: 'https://tournaments.esportspro.com', icon: '🏆' },
        { id: '2', title: 'Training Stream', url: 'https://stream.esportspro.com', icon: '🎯' },
        { id: '3', title: 'Team Merchandise', url: 'https://merch.esportspro.com', icon: '👕' },
        { id: '4', title: 'Coaching Services', url: 'https://coaching.esportspro.com', icon: '🎓' },
        { id: '5', title: 'Sponsorship', url: 'mailto:sponsor@esportspro.com', icon: '💼' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/esportspro',
        instagram: 'https://instagram.com/esportspro',
        youtube: 'https://youtube.com/esportspro',
        tiktok: 'https://tiktok.com/@esportspro',
        facebook: '',
        linkedin: '',
        website: 'https://esportspro.com'
      }
    }
  },

  // Crypto Themes
  {
    id: 'crypto-gold',
    name: 'Crypto King',
    category: 'Crypto',
    description: 'Golden Bitcoin-inspired theme for crypto enthusiasts',
    icon: Bitcoin,
    primaryColor: '#f59e0b',
    backgroundColor: '#000000',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'circle',
    buttonStyle: 'filled',
    preview: 'Gold & black crypto theme',
    popular: true,
    templateData: {
      businessName: 'Crypto King Trading',
      description: 'Master cryptocurrency trader and blockchain evangelist. Sharing winning strategies, market insights, and the path to financial freedom through crypto.',
      customLinks: [
        { id: '1', title: 'Trading Signals', url: 'https://signals.cryptoking.com', icon: '📈' },
        { id: '2', title: 'DeFi Portfolio', url: 'https://defi.cryptoking.com', icon: '💰' },
        { id: '3', title: 'Crypto Course', url: 'https://course.cryptoking.com', icon: '🎓' },
        { id: '4', title: 'Market Analysis', url: 'https://analysis.cryptoking.com', icon: '📊' },
        { id: '5', title: 'VIP Community', url: 'https://vip.cryptoking.com', icon: '👑' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/cryptoking',
        instagram: 'https://instagram.com/cryptoking',
        youtube: 'https://youtube.com/cryptoking',
        tiktok: 'https://tiktok.com/@cryptoking',
        facebook: '',
        linkedin: '',
        website: 'https://cryptoking.com'
      }
    }
  },
  {
    id: 'defi-blue',
    name: 'DeFi Professional',
    category: 'Crypto',
    description: 'Professional blue theme for DeFi and blockchain projects',
    icon: Bitcoin,
    primaryColor: '#38bdf8',
    backgroundColor: '#f8fafc',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'outline',
    preview: 'Blue DeFi professional theme',
    templateData: {
      businessName: 'DeFi Professional',
      description: 'Building the future of decentralized finance through innovative protocols and yield strategies. Professional DeFi consulting and project development.',
      customLinks: [
        { id: '1', title: 'DeFi Protocols', url: 'https://protocols.defi.pro', icon: '🔗' },
        { id: '2', title: 'Yield Strategies', url: 'https://yield.defi.pro', icon: '📈' },
        { id: '3', title: 'Smart Contracts', url: 'https://contracts.defi.pro', icon: '🔐' },
        { id: '4', title: 'DeFi Education', url: 'https://learn.defi.pro', icon: '📚' },
        { id: '5', title: 'Consulting Services', url: 'mailto:consulting@defi.pro', icon: '💼' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/defipro',
        instagram: '',
        youtube: 'https://youtube.com/defipro',
        tiktok: '',
        facebook: '',
        linkedin: 'https://linkedin.com/in/defipro',
        website: 'https://defi.pro'
      }
    }
  },
  {
    id: 'nft-rainbow',
    name: 'NFT Creator',
    category: 'Crypto',
    description: 'Colorful theme for NFT creators and collectors',
    icon: Bitcoin,
    primaryColor: '#8b5cf6',
    backgroundColor: '#1e1b4b',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'glass',
    preview: 'Purple NFT theme',
    templateData: {
      businessName: 'NFT Creator Studio',
      description: 'Digital artist creating unique NFT collections that blend creativity with blockchain innovation. Exploring the intersection of art and technology.',
      customLinks: [
        { id: '1', title: 'NFT Collection', url: 'https://opensea.io/yourcollection', icon: '🎨' },
        { id: '2', title: 'Mint New Drop', url: 'https://mint.nftcreator.art', icon: '🌟' },
        { id: '3', title: 'Art Gallery', url: 'https://gallery.nftcreator.art', icon: '🖼️' },
        { id: '4', title: 'Creator Tools', url: 'https://tools.nftcreator.art', icon: '🛠️' },
        { id: '5', title: 'Commission Art', url: 'mailto:commission@nftcreator.art', icon: '💎' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/nftcreator',
        instagram: 'https://instagram.com/nftcreator',
        youtube: 'https://youtube.com/nftcreator',
        tiktok: 'https://tiktok.com/@nftcreator',
        facebook: '',
        linkedin: '',
        website: 'https://nftcreator.art'
      }
    }
  },

  // Lifestyle Themes
  {
    id: 'wellness-green',
    name: 'Wellness & Health',
    category: 'Lifestyle',
    description: 'Calming green theme for health and wellness professionals',
    icon: Heart,
    primaryColor: '#10b981',
    backgroundColor: '#f0fdf4',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'rounded',
    buttonStyle: 'filled',
    preview: 'Green wellness theme',
    templateData: {
      businessName: 'Wellness & Health Hub',
      description: 'Empowering your journey to optimal health and wellness through holistic practices, mindful living, and personalized wellness solutions.',
      customLinks: [
        { id: '1', title: 'Wellness Programs', url: 'https://programs.wellnesshub.com', icon: '🌿' },
        { id: '2', title: 'Health Coaching', url: 'https://coaching.wellnesshub.com', icon: '💚' },
        { id: '3', title: 'Meditation Guide', url: 'https://meditation.wellnesshub.com', icon: '🧘' },
        { id: '4', title: 'Nutrition Plans', url: 'https://nutrition.wellnesshub.com', icon: '🥗' },
        { id: '5', title: 'Book Consultation', url: 'mailto:hello@wellnesshub.com', icon: '📅' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/wellnesshub',
        instagram: 'https://instagram.com/wellnesshub',
        youtube: 'https://youtube.com/wellnesshub',
        tiktok: 'https://tiktok.com/@wellnesshub',
        facebook: 'https://facebook.com/wellnesshub',
        linkedin: '',
        website: 'https://wellnesshub.com'
      }
    }
  },
  {
    id: 'influencer-pink',
    name: 'Social Influencer',
    category: 'Lifestyle',
    description: 'Trendy pink theme perfect for social media influencers',
    icon: Star,
    primaryColor: '#ec4899',
    backgroundColor: '#fdf2f8',
    backgroundType: 'color',
    backgroundGif: '',
    iconStyle: 'circle',
    buttonStyle: 'filled',
    preview: 'Pink influencer theme',
    templateData: {
      businessName: 'Social Influencer',
      description: 'Lifestyle influencer sharing fashion, beauty, and daily inspiration. Join my community for authentic content and positive vibes!',
      customLinks: [
        { id: '1', title: 'Latest Content', url: 'https://content.socialinfluencer.com', icon: '✨' },
        { id: '2', title: 'Brand Collaborations', url: 'https://collabs.socialinfluencer.com', icon: '💖' },
        { id: '3', title: 'Style Guide', url: 'https://style.socialinfluencer.com', icon: '👗' },
        { id: '4', title: 'Exclusive Content', url: 'https://exclusive.socialinfluencer.com', icon: '🌸' },
        { id: '5', title: 'Contact for Partnerships', url: 'mailto:partnerships@socialinfluencer.com', icon: '💕' }
      ],
      socialLinks: {
        twitter: 'https://twitter.com/socialinfluencer',
        instagram: 'https://instagram.com/socialinfluencer',
        youtube: 'https://youtube.com/socialinfluencer',
        tiktok: 'https://tiktok.com/@socialinfluencer',
        facebook: 'https://facebook.com/socialinfluencer',
        linkedin: '',
        website: 'https://socialinfluencer.com'
      }
    }
  }
];

interface ReadyThemeSelectorProps {
  currentTheme: {
    primaryColor: string;
    backgroundColor: string;
    backgroundType: 'color' | 'gif' | 'video';
    backgroundGif: string;
    iconStyle: string;
    buttonStyle: string;
  };
  onThemeSelect: (theme: Partial<ReadyThemeSelectorProps['currentTheme']>) => void;
}

const ReadyThemeSelector = ({ currentTheme, onThemeSelect }: ReadyThemeSelectorProps) => {
  const categories = [...new Set(readyThemes.map(theme => theme.category))];

  const handleThemeSelect = (theme: ReadyTheme) => {
    onThemeSelect({
      primaryColor: theme.primaryColor,
      backgroundColor: theme.backgroundColor,
      backgroundType: theme.backgroundType,
      backgroundGif: theme.backgroundGif,
      iconStyle: theme.iconStyle,
      buttonStyle: theme.buttonStyle,
    });
  };

  const isCurrentTheme = (theme: ReadyTheme) => {
    return currentTheme.primaryColor === theme.primaryColor &&
           currentTheme.backgroundColor === theme.backgroundColor &&
           currentTheme.backgroundType === theme.backgroundType;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Ready-to-Use Themes</h3>
        <Badge variant="secondary" className="ml-2">New!</Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Choose from professionally designed themes tailored for your industry or style. One-click setup!
      </p>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            {category}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readyThemes
              .filter(theme => theme.category === category)
              .map((theme) => {
                const IconComponent = theme.icon;
                const isCurrent = isCurrentTheme(theme);
                
                return (
                  <Card 
                    key={theme.id}
                    className={`relative cursor-pointer transition-all hover:scale-[1.02] ${
                      isCurrent 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:shadow-md border-border'
                    }`}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Theme Preview */}
                        <div className="flex-shrink-0">
                          <div 
                            className="w-12 h-12 rounded-lg border-2 flex items-center justify-center relative overflow-hidden"
                            style={{ 
                              backgroundColor: theme.backgroundColor,
                              borderColor: theme.primaryColor 
                            }}
                          >
                            {theme.backgroundType === 'gif' && theme.backgroundGif && (
                              <img 
                                src={theme.backgroundGif} 
                                alt="" 
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                              />
                            )}
                            <IconComponent 
                              className="w-6 h-6 relative z-10"
                              {...({ style: { color: theme.primaryColor } } as any)}
                            />
                          </div>
                        </div>

                        {/* Theme Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-sm">{theme.name}</h5>
                            {theme.popular && <Badge variant="default" className="text-xs">Popular</Badge>}
                            {theme.new && <Badge variant="secondary" className="text-xs">New</Badge>}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {theme.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: theme.primaryColor }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {theme.preview}
                            </span>
                          </div>
                        </div>

                        {/* Current Indicator */}
                        {isCurrent && (
                          <div className="flex-shrink-0">
                            <Badge variant="default" className="text-xs">Current</Badge>
                          </div>
                        )}
                      </div>

                      {/* Quick Preview Bar */}
                      <div className="mt-3 flex gap-1">
                        <div 
                          className="h-1 flex-1 rounded"
                          style={{ backgroundColor: theme.backgroundColor }}
                        />
                        <div 
                          className="h-1 flex-1 rounded"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                        <div 
                          className="h-1 flex-1 rounded opacity-50"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Palette className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h5 className="font-semibold text-sm mb-1">Can't find your style?</h5>
            <p className="text-xs text-muted-foreground mb-2">
              Use the custom color tools below to create your unique theme, or contact us to request a new ready-made theme.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadyThemeSelector;