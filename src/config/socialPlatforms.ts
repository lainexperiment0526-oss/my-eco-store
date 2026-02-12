/**
 * Comprehensive Social Media Platforms Configuration
 * All major social networks with latest icons and metadata
 */

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string; // emoji for now, will use react-icons in components
  placeholder: string;
  urlPrefix?: string;
  color: string; // brand color
  category: 'social' | 'professional' | 'content' | 'messaging' | 'creative' | 'gaming' | 'music';
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  // Social Networks
  {
    id: 'dropshare',
    name: 'DropShare',
    icon: '🔗',
    placeholder: 'https://dropshare.space/username',
    urlPrefix: 'dropshare.space/',
    color: '#38bdf8',
    category: 'social'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    placeholder: 'https://instagram.com/username',
    urlPrefix: 'instagram.com/',
    color: '#E4405F',
    category: 'social'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    placeholder: 'https://x.com/username',
    urlPrefix: 'x.com/',
    color: '#000000',
    category: 'social'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    placeholder: 'https://facebook.com/username',
    urlPrefix: 'facebook.com/',
    color: '#1877F2',
    category: 'social'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: '👻',
    placeholder: 'https://snapchat.com/add/username',
    urlPrefix: 'snapchat.com/add/',
    color: '#FFFC00',
    category: 'social'
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '@',
    placeholder: 'https://threads.net/@username',
    urlPrefix: 'threads.net/@',
    color: '#000000',
    category: 'social'
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    icon: '🦋',
    placeholder: 'https://bsky.app/profile/username',
    urlPrefix: 'bsky.app/profile/',
    color: '#0085FF',
    category: 'social'
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    icon: '🐘',
    placeholder: 'https://mastodon.social/@username',
    color: '#6364FF',
    category: 'social'
  },
  
  // Professional
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    placeholder: 'https://linkedin.com/in/username',
    urlPrefix: 'linkedin.com/in/',
    color: '#0A66C2',
    category: 'professional'
  },
  
  // Content Platforms
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    placeholder: 'https://youtube.com/@username',
    urlPrefix: 'youtube.com/@',
    color: '#FF0000',
    category: 'content'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    placeholder: 'https://tiktok.com/@username',
    urlPrefix: 'tiktok.com/@',
    color: '#000000',
    category: 'content'
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: '🎮',
    placeholder: 'https://twitch.tv/username',
    urlPrefix: 'twitch.tv/',
    color: '#9146FF',
    category: 'gaming'
  },
  {
    id: 'kick',
    name: 'Kick',
    icon: '⚡',
    placeholder: 'https://kick.com/username',
    urlPrefix: 'kick.com/',
    color: '#53FC18',
    category: 'gaming'
  },
  {
    id: 'vimeo',
    name: 'Vimeo',
    icon: '🎬',
    placeholder: 'https://vimeo.com/username',
    urlPrefix: 'vimeo.com/',
    color: '#1AB7EA',
    category: 'content'
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    placeholder: 'https://pinterest.com/username',
    urlPrefix: 'pinterest.com/',
    color: '#E60023',
    category: 'creative'
  },
  
  // Messaging
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    placeholder: 'https://wa.me/1234567890',
    urlPrefix: 'wa.me/',
    color: '#25D366',
    category: 'messaging'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    placeholder: 'https://t.me/username',
    urlPrefix: 't.me/',
    color: '#0088CC',
    category: 'messaging'
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '💬',
    placeholder: 'https://discord.gg/invite',
    urlPrefix: 'discord.gg/',
    color: '#5865F2',
    category: 'messaging'
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💼',
    placeholder: 'https://workspace.slack.com',
    color: '#4A154B',
    category: 'messaging'
  },
  
  // Creative & Design
  {
    id: 'behance',
    name: 'Behance',
    icon: '🎨',
    placeholder: 'https://behance.net/username',
    urlPrefix: 'behance.net/',
    color: '#1769FF',
    category: 'creative'
  },
  {
    id: 'dribbble',
    name: 'Dribbble',
    icon: '🏀',
    placeholder: 'https://dribbble.com/username',
    urlPrefix: 'dribbble.com/',
    color: '#EA4C89',
    category: 'creative'
  },
  {
    id: 'deviantart',
    name: 'DeviantArt',
    icon: '🎨',
    placeholder: 'https://deviantart.com/username',
    urlPrefix: 'deviantart.com/',
    color: '#05CC47',
    category: 'creative'
  },
  
  // Developer
  {
    id: 'github',
    name: 'GitHub',
    icon: '💻',
    placeholder: 'https://github.com/username',
    urlPrefix: 'github.com/',
    color: '#181717',
    category: 'professional'
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    placeholder: 'https://gitlab.com/username',
    urlPrefix: 'gitlab.com/',
    color: '#FC6D26',
    category: 'professional'
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    icon: '📚',
    placeholder: 'https://stackoverflow.com/users/id',
    urlPrefix: 'stackoverflow.com/users/',
    color: '#F58025',
    category: 'professional'
  },
  
  // Music
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎧',
    placeholder: 'https://open.spotify.com/artist/id',
    urlPrefix: 'open.spotify.com/',
    color: '#1DB954',
    category: 'music'
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: '🔊',
    placeholder: 'https://soundcloud.com/username',
    urlPrefix: 'soundcloud.com/',
    color: '#FF5500',
    category: 'music'
  },
  {
    id: 'applemusic',
    name: 'Apple Music',
    icon: '🎵',
    placeholder: 'https://music.apple.com/profile/username',
    color: '#FA243C',
    category: 'music'
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    icon: '🎸',
    placeholder: 'https://username.bandcamp.com',
    color: '#629AA9',
    category: 'music'
  },
  
  // Content Creation & Monetization
  {
    id: 'patreon',
    name: 'Patreon',
    icon: '💖',
    placeholder: 'https://patreon.com/username',
    urlPrefix: 'patreon.com/',
    color: '#FF424D',
    category: 'content'
  },
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    icon: '💎',
    placeholder: 'https://onlyfans.com/username',
    urlPrefix: 'onlyfans.com/',
    color: '#00AFF0',
    category: 'content'
  },
  {
    id: 'substack',
    name: 'Substack',
    icon: '📰',
    placeholder: 'https://username.substack.com',
    color: '#FF6719',
    category: 'content'
  },
  {
    id: 'medium',
    name: 'Medium',
    icon: '📝',
    placeholder: 'https://medium.com/@username',
    urlPrefix: 'medium.com/@',
    color: '#000000',
    category: 'content'
  },
  
  // Business & Shopping
  {
    id: 'etsy',
    name: 'Etsy',
    icon: '🛍️',
    placeholder: 'https://etsy.com/shop/shopname',
    urlPrefix: 'etsy.com/shop/',
    color: '#F16521',
    category: 'professional'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛒',
    placeholder: 'https://yourstore.myshopify.com',
    color: '#96BF48',
    category: 'professional'
  },
  {
    id: 'amazon',
    name: 'Amazon Store',
    icon: '📦',
    placeholder: 'https://amazon.com/shops/username',
    color: '#FF9900',
    category: 'professional'
  },
  
  // Other
  {
    id: 'reddit',
    name: 'Reddit',
    icon: '👽',
    placeholder: 'https://reddit.com/user/username',
    urlPrefix: 'reddit.com/user/',
    color: '#FF4500',
    category: 'social'
  },
  {
    id: 'clubhouse',
    name: 'Clubhouse',
    icon: '🎙️',
    placeholder: 'https://clubhouse.com/@username',
    urlPrefix: 'clubhouse.com/@',
    color: '#F2EE7C',
    category: 'social'
  },
  {
    id: 'linktree',
    name: 'Linktree',
    icon: '🌳',
    placeholder: 'https://linktr.ee/username',
    urlPrefix: 'linktr.ee/',
    color: '#43E55E',
    category: 'professional'
  },
  {
    id: 'website',
    name: 'Website',
    icon: '🌐',
    placeholder: 'https://yourwebsite.com',
    color: '#6B7280',
    category: 'professional'
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    placeholder: 'mailto:your@email.com',
    urlPrefix: 'mailto:',
    color: '#EA4335',
    category: 'professional'
  },
  {
    id: 'phone',
    name: 'Phone',
    icon: '📞',
    placeholder: 'tel:+1234567890',
    urlPrefix: 'tel:',
    color: '#34A853',
    category: 'professional'
  },
];

// Helper function to get platform by ID
export const getPlatformById = (id: string): SocialPlatform | undefined => {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
};

// Helper function to get platforms by category
export const getPlatformsByCategory = (category: SocialPlatform['category']): SocialPlatform[] => {
  return SOCIAL_PLATFORMS.filter(p => p.category === category);
};

// Helper to get all categories
export const getCategories = (): string[] => {
  return Array.from(new Set(SOCIAL_PLATFORMS.map(p => p.category)));
};
