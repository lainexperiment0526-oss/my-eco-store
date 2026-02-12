
# 🚀 **Droplink — Pi Network Link-in-Bio Storefront Builder**

*A modern, customizable Droplink-style storefront built for the Pi Network ecosystem.*

Droplink lets creators, sellers, businesses, and Pi Pioneers build a **personal storefront**, connect their **.pi domain**, sell products, accept Pi payments, and manage all links in one beautiful page.

Droplink is designed to be fast, simple, customizable, and fully integrated with Pi Network authentication, Pi payments, and Supabase.

---

## 🏆 **Key Features**

### 🔗 Link-in-Bio System

* Stack, Grid, Carousel, and Showcase layouts
* Smart categories (Commerce, Social, Media, Events, Contact, Notes)
* Inline editing + drag-and-drop sorting
* Advanced customization: icons, favicons, metadata, animations
* Real-time preview + fully responsive design

### 🎨 Customization & Themes

* 18+ professional themes (business, lifestyle, creative, tech)
* Header, backgrounds, wallpapers, color palettes
* Upload / URL GIF backgrounds
* Typography presets
* Quick style presets

### 🛒 Storefront & Commerce

* Sell digital or physical products
* Public payment pages
* Pi Network mainnet payments
* Smart contract integrations
* DropPay + future DROP token support
* Real-time transaction status

### 💰 Monetization & Plans

* Free, Premium, and Pro accounts
* Pi payment subscription system
* Feature gating: analytics, themes, advanced blocks
* Pi Ad Network for free users

### 📊 Analytics

* Link clicks, views, visitor metrics
* A/B testing (Pro)
* Location, device, and behavior data
* Export analytics (CSV/JSON/API)

### 🛡 Backend & Security

* Supabase database
* Row-level security (RLS)
* Edge functions for updates, analytics, themes
* Secure profile + domain + payment storage

---

# 🧱 **Architecture**

### **Frontend**

* Next.js 14 + App Router
* TailwindCSS
* Supabase Auth
* Pi SDK for payments & login
* Realtime updates + server actions

### **Backend (Supabase)**

* PostgreSQL
* Edge Functions:

  * `profile-update`
  * `link-analytics`
  * `theme-management`
  * `payment-callback`
* Storage buckets for images, GIFs, themes
* RLS-level security across all tables

### **Payments**

* Pi Network mainnet
* Smart contracts
* Pi Wallet connect
* DropPay integration

---

# 📂 **Project Structure**

```
/app
  /dashboard
  /theme
  /store
  /api
/components
/lib
/styles
/supabase
/docs
```

---

# 🧩 **Core Database Tables**

* `profiles`
* `links`
* `themes`
* `subscriptions`
* `store_products`
* `store_orders`
* `payments`
* `domains`
* `analytics`

Each table includes full RLS and FK relations.

---

# ⚙️ **Environment Variables**

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PI_API_KEY=
PI_ENVIRONMENT=mainnet
PI_WEBHOOK_SECRET=

DROPLINK_APP_URL=https://droplink.app
```

---

# 🚀 **Getting Started**

### **1. Install dependencies**

```
npm install
```

### **2. Start Dev Server**

```
npm run dev
```

### **3. Supabase Setup**

Run migrations and seed data:

```
supabase db push
supabase db seed
```

### **4. Deploy Edge Functions**

```
supabase functions deploy profile-update
supabase functions deploy link-analytics
supabase functions deploy theme-management
supabase functions deploy payment-callback
```

---

# 📦 **Deployment**

### **Vercel + Supabase recommended**

* Connect repo to Vercel
* Add environment variables
* Auto-deploy on push

### **Custom Domains**

Droplink supports connecting:

* `yourname.pi`
* Custom Pi domains (future marketplace)
* SSL auto-generation

---

# 🛣 **Roadmap**

* Full .pi domain integration
* Multi-profile support
* Marketplace for themes + blocks
* Pi recurring subscriptions
* Pi Ad Network full release
* AI analytics
* AI storefront builder
* Team management + agencies
* Desktop version

Full roadmap in `/docs/ROADMAP.md`

---

# 🤝 **Contributing**

1. Fork repo
2. Create a feature branch
3. Submit PR
4. Follow code formatting via ESLint + Prettier

---

# 📄 **License**

MIT License — free for personal and commercial use.

---

# 🔥 **Status**

✔ Core platform complete
🔄 Expanding AI, commerce, and domain ecosystem
🚀 Preparing Pi mainnet release

---

If you want, I can also:
✅ Create `/docs/ROADMAP.md`
✅ Create `/docs/API.md`
✅ Create `/docs/SETUP.md`
✅ Create `/docs/DB_SCHEMA.md`
Just tell me which ones you want!
