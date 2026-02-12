import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Sanitize and validate image URL
 */
function validateImageUrl(url) {
  if (!url) return null;
  
  try {
    const imageUrl = new URL(url);
    // Only allow https and http
    if (!['https:', 'http:'].includes(imageUrl.protocol)) {
      return null;
    }
    return url;
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize text for HTML meta tags (remove quotes, newlines, etc.)
 */
function sanitizeMetaText(text) {
  if (!text) return '';
  return text
    .trim()
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, ' ')
    .substring(0, 500); // Limit to reasonable length
}

/**
 * Fetch user profile data from Supabase
 */
async function fetchUserProfile(username) {
  try {
    const supabase = getSupabaseClient();
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, display_name, bio, avatar_url, id')
      .eq('username', username)
      .maybeSingle();
    
    if (error) {
      console.error('Supabase error:', error);
      return null;
    }
    
    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

/**
 * Generate dynamic Open Graph and Twitter metadata for a user profile
 */
async function generateProfileMetadata(username) {
  // Fetch user profile
  const profile = await fetchUserProfile(username);
  
  if (!profile) {
    // Return default metadata for not found
    return {
      title: 'Profile Not Found | Droplink',
      description: 'User profile not found on Droplink',
      ogTitle: 'Profile Not Found | Droplink',
      ogDescription: 'User profile not found on Droplink',
      ogImage: 'https://i.ibb.co/67KHWdv9/Add-a-subheading-2-removebg-preview.png',
      twitterTitle: 'Profile Not Found | Droplink',
      twitterDescription: 'User profile not found on Droplink',
      twitterImage: 'https://i.ibb.co/67KHWdv9/Add-a-subheading-2-removebg-preview.png',
      url: `https://droplink.space/@${username}`,
      notFound: true
    };
  }
  
  // Build display name
  const displayName = profile.display_name || profile.username;
  
  // Prepare bio/description
  const bio = sanitizeMetaText(profile.bio || `Check out @${profile.username}'s profile on Droplink`);
  
  // Validate and use avatar image
  const avatarUrl = validateImageUrl(profile.avatar_url) || 'https://i.ibb.co/67KHWdv9/Add-a-subheading-2-removebg-preview.png';
  
  // Build URLs
  const pageUrl = `https://droplink.space/@${profile.username}`;
  
  return {
    title: `@${profile.username} | Droplink`,
    description: bio,
    ogTitle: `@${profile.username} on Droplink`,
    ogDescription: bio,
    ogImage: avatarUrl,
    ogType: 'profile',
    ogImageWidth: '1200',
    ogImageHeight: '630',
    twitterCard: 'summary_large_image',
    twitterTitle: `@${profile.username} on Droplink`,
    twitterDescription: bio,
    twitterImage: avatarUrl,
    twitterImageAlt: `${displayName}'s profile on Droplink`,
    url: pageUrl,
    notFound: false,
    displayName,
    username: profile.username
  };
}

/**
 * Inject metadata into HTML
 */
function injectMetadataIntoHtml(html, metadata) {
  // Create meta tags
  const metaTags = [
    // Basic title
    `<title>${sanitizeMetaText(metadata.title)}</title>`,
    `<meta name="title" content="${sanitizeMetaText(metadata.title)}" />`,
    `<meta name="description" content="${sanitizeMetaText(metadata.description)}" />`,
    
    // Open Graph
    `<meta property="og:type" content="${metadata.ogType || 'website'}" />`,
    `<meta property="og:url" content="${metadata.url}" />`,
    `<meta property="og:title" content="${sanitizeMetaText(metadata.ogTitle)}" />`,
    `<meta property="og:description" content="${sanitizeMetaText(metadata.ogDescription)}" />`,
    `<meta property="og:image" content="${metadata.ogImage}" />`,
    `<meta property="og:image:width" content="${metadata.ogImageWidth || '1200'}" />`,
    `<meta property="og:image:height" content="${metadata.ogImageHeight || '630'}" />`,
    `<meta property="og:image:alt" content="${sanitizeMetaText(metadata.displayName || metadata.username)}'s profile on Droplink" />`,
    `<meta property="og:site_name" content="Droplink" />`,
    `<meta property="og:locale" content="en_US" />`,
    
    // Twitter / X
    `<meta name="twitter:card" content="${metadata.twitterCard}" />`,
    `<meta name="twitter:url" content="${metadata.url}" />`,
    `<meta name="twitter:title" content="${sanitizeMetaText(metadata.twitterTitle)}" />`,
    `<meta name="twitter:description" content="${sanitizeMetaText(metadata.twitterDescription)}" />`,
    `<meta name="twitter:image" content="${metadata.twitterImage}" />`,
    `<meta name="twitter:image:alt" content="${sanitizeMetaText(metadata.twitterImageAlt)}" />`,
  ];
  
  // Find the head tag and inject metadata
  const headTagRegex = /<head[^>]*>/i;
  const headMatch = html.match(headTagRegex);
  
  if (headMatch) {
    const headTag = headMatch[0];
    // Find the existing og/twitter meta tags and replace them
    const newHead = headTag + '\n    ' + metaTags.join('\n    ');
    // Remove old og/twitter tags
    html = html.replace(headTag, newHead);
    html = html.replace(/<meta\s+(property="og:|name="twitter:|name="description|name="title")/gi, '<!-- Replaced: $1');
  }
  
  return html;
}

export {
  generateProfileMetadata,
  injectMetadataIntoHtml,
  fetchUserProfile,
  sanitizeMetaText,
  validateImageUrl
};
