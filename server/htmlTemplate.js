/**
 * Generate a complete HTML page with injected metadata
 * This serves as a template for social media crawlers
 */
function createMetadataHtmlPage(metadata) {
  const {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    ogType = 'profile',
    ogImageWidth = '1200',
    ogImageHeight = '630',
    twitterCard = 'summary_large_image',
    twitterTitle,
    twitterDescription,
    twitterImage,
    twitterImageAlt,
    url,
    username,
    displayName
  } = metadata;

  // Sanitize text for HTML attributes
  const sanitize = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Title & Description -->
  <title>${sanitize(title)}</title>
  <meta name="title" content="${sanitize(title)}" />
  <meta name="description" content="${sanitize(description)}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${sanitize(ogType)}" />
  <meta property="og:url" content="${sanitize(url)}" />
  <meta property="og:title" content="${sanitize(ogTitle)}" />
  <meta property="og:description" content="${sanitize(ogDescription)}" />
  <meta property="og:image" content="${sanitize(ogImage)}" />
  <meta property="og:image:width" content="${sanitize(ogImageWidth)}" />
  <meta property="og:image:height" content="${sanitize(ogImageHeight)}" />
  <meta property="og:image:alt" content="${sanitize((displayName || username) + '\'s profile on Droplink')}" />
  <meta property="og:site_name" content="Droplink" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter / X -->
  <meta name="twitter:card" content="${sanitize(twitterCard)}" />
  <meta name="twitter:url" content="${sanitize(url)}" />
  <meta name="twitter:title" content="${sanitize(twitterTitle)}" />
  <meta name="twitter:description" content="${sanitize(twitterDescription)}" />
  <meta name="twitter:image" content="${sanitize(twitterImage)}" />
  <meta name="twitter:image:alt" content="${sanitize(twitterImageAlt)}" />
  <meta name="twitter:creator" content="@DropLinkApp" />
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${sanitize(url)}" />
  
  <!-- Redirect to Vite app -->
  <script>
    // Give crawlers time to read meta tags, then redirect
    setTimeout(function() {
      window.location.href = '/@${sanitize(username)}';
    }, 100);
  </script>
</head>
<body>
  <noscript>
    <p>Please enable JavaScript to view @${sanitize(username)}'s profile on Droplink.</p>
    <p><a href="/">Go to Droplink</a></p>
  </noscript>
  <div style="display: none;">
    <p>Loading @${sanitize(username)}'s profile...</p>
  </div>
</body>
</html>`;
}

/**
 * Create HTML page with metadata for not-found profiles
 */
function createNotFoundHtmlPage(username) {
  const sanitize = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Title & Description -->
  <title>Profile Not Found | Droplink</title>
  <meta name="title" content="Profile Not Found | Droplink" />
  <meta name="description" content="The profile @${sanitize(username)} was not found on Droplink." />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://droplink.space/@${sanitize(username)}" />
  <meta property="og:title" content="Profile Not Found | Droplink" />
  <meta property="og:description" content="The profile @${sanitize(username)} was not found on Droplink." />
  <meta property="og:image" content="https://i.ibb.co/67KHWdv9/Add-a-subheading-2-removebg-preview.png" />
  <meta property="og:site_name" content="Droplink" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://droplink.space/@${sanitize(username)}" />
  <meta name="twitter:title" content="Profile Not Found | Droplink" />
  <meta name="twitter:description" content="The profile @${sanitize(username)} was not found on Droplink." />
  <meta name="twitter:image" content="https://i.ibb.co/67KHWdv9/Add-a-subheading-2-removebg-preview.png" />
  <meta name="twitter:creator" content="@DropLinkApp" />
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://droplink.space/@${sanitize(username)}" />
  
  <!-- Redirect -->
  <script>
    setTimeout(function() {
      window.location.href = '/@${sanitize(username)}';
    }, 100);
  </script>
</head>
<body>
  <noscript>
    <p>Profile not found. Please enable JavaScript to continue.</p>
    <p><a href="/">Go to Droplink</a></p>
  </noscript>
  <div style="display: none;">
    <p>Profile not found...</p>
  </div>
</body>
</html>`;
}

export {
  createMetadataHtmlPage,
  createNotFoundHtmlPage
};
