import express from 'express';
const app = express();

// Example metadata for different paths
const metadataMap = {
  '/': {
    title: 'DropLink – PiNet Mainnet',
    description: 'DropLink is the easiest way to send, receive, and manage Pi payments and tokens. Now fully integrated with PiNet mainnet!',
    authors: [
      { name: 'DropLink Team', url: 'https://droplink.space/about' }
    ],
    keywords: ['Pi Network', 'DropLink', 'Pi Payments', 'Crypto', 'Mainnet', 'PiNet'],
    creator: 'DropLink Team',
    publisher: 'DropLink',
    formatDetection: {
      telephone: false,
      date: true,
      address: false,
      email: true,
      url: true
    },
    abstract: 'DropLink: Pi Network payments, tokens, and more.',
    category: 'Finance',
    classification: 'Web App',
    openGraph: {
      type: 'website',
      title: 'DropLink – PiNet Mainnet',
      description: 'Send, receive, and manage Pi payments and tokens with DropLink on PiNet mainnet.',
      locale: 'en_US',
      alternateLocale: ['es_ES', 'zh_CN'],
      images: [
        {
          url: 'https://droplink2920.pinet.com/og-image.png',
          alt: 'DropLink Logo',
          width: 1200,
          height: 630,
          type: 'image/png',
        }
      ],
      emails: ['support@droplink.space'],
      countryName: 'Global',
      siteName: 'DropLink',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'DropLink – PiNet Mainnet',
      description: 'Send, receive, and manage Pi payments and tokens with DropLink on PiNet mainnet.',
      creator: '@DropLinkApp',
      images: [
        {
          url: 'https://droplink2920.pinet.com/twitter-image.png',
          alt: 'DropLink Logo',
          width: 1200,
          height: 630,
          type: 'image/png',
        }
      ]
    },
    icons: {
      icon: [
        {
          url: 'https://droplink2920.pinet.com/favicon.ico',
          type: 'image/x-icon',
          sizes: '32x32',
        },
        {
          url: 'https://droplink2920.pinet.com/icon-192.png',
          type: 'image/png',
          sizes: '192x192',
        }
      ],
      apple: [
        {
          url: 'https://droplink2920.pinet.com/apple-touch-icon.png',
          type: 'image/png',
          sizes: '180x180',
        }
      ]
    }
  },
  // Add more path-specific metadata as needed
};

app.get('/pinet/meta', (req, res) => {
  const pathname = req.query.pathname || '/';
  const meta = metadataMap[pathname] || metadataMap['/'];
  res.json(meta);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PiNet metadata server running on port ${PORT}`);
});
