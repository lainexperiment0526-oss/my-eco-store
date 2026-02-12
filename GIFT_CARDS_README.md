# 🎄 DropLink Christmas Gift Cards Feature

## Overview
A complete Christmas-themed gift card system that allows users to purchase and share DropLink subscriptions with friends and loved ones.

## ✨ Features

### 🎁 Purchase Gift Cards
- **Christmas Theme**: Festive red and green design with animated snowflakes
- **Multiple Plans**: Basic, Premium, and Pro subscriptions
- **Billing Options**: Monthly or Yearly (20% savings)
- **Personal Touch**: Add custom messages and recipient emails
- **Email Delivery**: Automated Christmas-themed email delivery

### 🎄 Redeem Gift Cards
- **Easy Redemption**: Enter 16-character code
- **Instant Activation**: Subscription starts immediately
- **Festive UI**: Christmas-themed interface with animations

## 📦 Files Created

### Database
- **`add-gift-cards.sql`** - Complete database schema
  - `gift_cards` table
  - Code generation function
  - Timestamp triggers
  - Expiration management

### Components
- **`src/components/GiftCardModal.tsx`** - Main gift card UI
  - Christmas theme with snowflake animations
  - Buy and redeem tabs
  - Email integration
  - Responsive design

### Backend
- **`supabase/functions/send-gift-card-email/index.ts`** - Email service
  - Christmas-themed HTML email template
  - Sender information lookup
  - Error handling

### Styling
- **`src/index.css`** - Snowflake animation CSS

## 🚀 Setup Instructions

### 1. Database Setup
```sql
-- Run in Supabase SQL Editor
\i add-gift-cards.sql
```

### 2. Edge Function Deployment
```bash
# Deploy the email function
supabase functions deploy send-gift-card-email

# Set up environment variables (if using email service)
supabase secrets set RESEND_API_KEY=your_api_key_here
```

### 3. Email Service Integration (Optional)
The email function currently logs emails. To enable actual sending:

**Option A: Resend (Recommended)**
```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'DropLink <gifts@droplink.space>',
    to: recipientEmail,
    subject: `🎄 You've Received a DropLink Christmas Gift Card! 🎁`,
    html: emailHtml
  })
})
```

**Option B: SendGrid**
```typescript
// Similar integration with SendGrid API
```

## 🎨 Christmas Design Features

### Visual Elements
- ❄️ Animated falling snowflakes
- 🎄 Christmas tree and Santa emojis
- 🎁 Gift box animations
- 🎅 Festive color scheme (Red, Green, Yellow/Gold)
- ✨ Sparkle effects
- 💌 Personal message cards

### Color Palette
- **Primary Red**: `#DC2626`
- **Christmas Green**: `#059669` / `#165B33`
- **Gold Accent**: `#FCD34D`
- **White Snow**: `#FFFFFF`
- **Background Gradients**: Red-to-Green transitions

### Animations
- Falling snowflakes (10s duration)
- Bouncing gift icons
- Pulsing sparkles
- Smooth transitions

## 📧 Email Template Features

### Email Includes:
1. **Header**: Christmas gradient with emoji decorations
2. **Sender Info**: Personalized from sender's profile
3. **Personal Message**: Optional custom message box
4. **Gift Code**: Large, copyable code display
5. **Plan Details**: Gift card value and benefits
6. **CTA Button**: Direct link to redemption page
7. **Instructions**: Step-by-step redemption guide
8. **Footer**: Support info and branding

### Email Style:
- Responsive design
- Christmas color scheme
- Professional yet festive
- Mobile-friendly
- Clear call-to-actions

## 🔧 Usage

### For Users:
1. **Navigate to Subscription Page**
2. **Click "Gift Cards" button**
3. **Choose "Buy Gift Card" tab**
4. **Select plan and billing period**
5. **Enter recipient email (optional)**
6. **Add personal Christmas message**
7. **Purchase with Pi payment**
8. **Share the generated code**

### For Recipients:
1. **Receive email with code**
2. **Visit droplink.space/subscription**
3. **Click "Gift Cards"**
4. **Choose "Redeem Code" tab**
5. **Enter the code**
6. **Enjoy premium subscription!**

## 🎯 Gift Card Properties

- **Format**: `DL-XXXXXXXXXXXX` (16 characters)
- **Validity**: 1 year from purchase
- **Usage**: One-time use only
- **Status Tracking**: Active, Redeemed, Expired, Cancelled
- **Plans**: Basic, Premium, Pro
- **Periods**: Monthly, Yearly

## 🔐 Security Features

- Unique code generation with collision detection
- One-time use enforcement
- Expiration date validation
- Profile-based purchase tracking
- Redemption tracking
- Status management

## 🌟 Future Enhancements

- [ ] Bulk gift card purchases
- [ ] Scheduled email delivery
- [ ] Gift card balance/credits
- [ ] Partial redemption
- [ ] Gift card marketplace
- [ ] Physical gift card designs
- [ ] QR code generation
- [ ] Gift card analytics

## 📊 Database Schema

### `gift_cards` Table
```sql
- id (UUID, Primary Key)
- code (VARCHAR, Unique, 16 chars)
- plan_type (VARCHAR: basic, premium, pro)
- billing_period (VARCHAR: monthly, yearly)
- pi_amount (DECIMAL)
- status (VARCHAR: active, redeemed, expired, cancelled)
- purchased_by_profile_id (UUID, FK)
- purchased_at (TIMESTAMP)
- redeemed_by_profile_id (UUID, FK)
- redeemed_at (TIMESTAMP)
- message (TEXT)
- recipient_email (VARCHAR)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🎁 Perfect For:
- 🎄 Christmas gifts
- 🎂 Birthday presents
- 💝 Valentine's Day
- 🎓 Graduation gifts
- 💼 Business gifts
- 🏆 Rewards and incentives
- 👥 Team appreciation
- ❤️ Showing appreciation

## 🆘 Support

For issues or questions:
- Email: support@droplink.space
- Documentation: This file
- Database: Check Supabase logs
- Functions: Monitor edge function logs

---

**Merry Christmas from DropLink! 🎄🎁**
