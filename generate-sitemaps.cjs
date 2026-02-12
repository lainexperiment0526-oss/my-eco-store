#!/usr/bin/env node

/**
 * Sitemap Generator for DropLink
 * Generates XML sitemaps for search engines
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BASE_URL = 'https://droplink.space';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate main sitemap
function generateMainSitemap() {
  const now = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Home Page -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Dashboard -->
  <url>
    <loc>${BASE_URL}/dashboard</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Settings -->
  <url>
    <loc>${BASE_URL}/settings</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- Wallet -->
  <url>
    <loc>${BASE_URL}/wallet</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Terms -->
  <url>
    <loc>${BASE_URL}/terms</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Privacy -->
  <url>
    <loc>${BASE_URL}/privacy</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
</urlset>`;
}

// Generate profiles sitemap
async function generateProfilesSitemap() {
  console.log('📋 Fetching profiles...');
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50000); // Google sitemap limit

  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return null;
  }

  console.log(`✅ Found ${profiles.length} profiles`);

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const profile of profiles) {
    const lastmod = profile.updated_at || new Date().toISOString();
    sitemap += `  <url>
    <loc>${BASE_URL}/@${profile.username}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
  }

  sitemap += `</urlset>`;
  return sitemap;
}

// Generate products sitemap
async function generateProductsSitemap() {
  console.log('📦 Fetching products...');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('id, profile_id, title, updated_at, profiles!inner(username)')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(50000);

  if (error) {
    console.error('❌ Error fetching products:', error);
    return null;
  }

  console.log(`✅ Found ${products.length} products`);

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const product of products) {
    const lastmod = product.updated_at || new Date().toISOString();
    const username = product.profiles?.username || 'unknown';
    sitemap += `  <url>
    <loc>${BASE_URL}/@${username}/product/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  sitemap += `</urlset>`;
  return sitemap;
}

// Generate sitemap index
function generateSitemapIndex() {
  const now = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-profiles.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-products.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
}

// Main execution
async function generateAllSitemaps() {
  console.log('🚀 Generating sitemaps for DropLink...\n');

  const outputDir = path.join(__dirname, 'public');
  
  // Generate main sitemap
  console.log('🏠 Generating main sitemap...');
  const mainSitemap = generateMainSitemap();
  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), mainSitemap);
  console.log('✅ Main sitemap created\n');

  // Generate profiles sitemap
  const profilesSitemap = await generateProfilesSitemap();
  if (profilesSitemap) {
    fs.writeFileSync(path.join(outputDir, 'sitemap-profiles.xml'), profilesSitemap);
    console.log('✅ Profiles sitemap created\n');
  }

  // Generate products sitemap
  const productsSitemap = await generateProductsSitemap();
  if (productsSitemap) {
    fs.writeFileSync(path.join(outputDir, 'sitemap-products.xml'), productsSitemap);
    console.log('✅ Products sitemap created\n');
  }

  // Generate sitemap index
  console.log('📑 Generating sitemap index...');
  const sitemapIndex = generateSitemapIndex();
  fs.writeFileSync(path.join(outputDir, 'sitemap-index.xml'), sitemapIndex);
  console.log('✅ Sitemap index created\n');

  console.log('🎉 All sitemaps generated successfully!');
  console.log('\n📍 Files created:');
  console.log('   - public/sitemap.xml (main pages)');
  console.log('   - public/sitemap-profiles.xml (user profiles)');
  console.log('   - public/sitemap-products.xml (products)');
  console.log('   - public/sitemap-index.xml (sitemap index)');
  console.log('\n💡 Submit these URLs to search engines:');
  console.log('   - https://droplink.space/sitemap-index.xml');
  console.log('   - https://search.google.com/search-console');
  console.log('   - https://www.bing.com/webmasters');
}

// Run
generateAllSitemaps().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
