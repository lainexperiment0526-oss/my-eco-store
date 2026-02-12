# Admin Panel Testing Guide - `/admin-mrwain`

## 🧪 What's Working

### ✅ Email/Password Authentication
- Sign Up with email and password (6+ chars)
- Sign In with registered email
- Sign Out functionality
- Profile data storage in Supabase

**Test Steps:**
1. Go to `/admin-mrwain`
2. Click "Need an account? Sign Up" or toggle signup mode
3. Enter email and password (min 6 chars)
4. Click "Sign Up" or "Sign In"
5. Should authenticate successfully

### ✅ Admin Dashboard (After Login)
- User information display (email, ID, verification status)
- Upload profile logo, avatar, background images
- Theme customization (colors, background style)
- File management with delete option
- Sign out button

---

## ⏳ What Needs Configuration

### ⏳ Google Sign-In
Currently shows error because Google OAuth is not configured in Supabase.

**To Fix:**
1. Follow [ADMIN_GOOGLE_OAUTH_SETUP.md](./ADMIN_GOOGLE_OAUTH_SETUP.md)
2. Get Google OAuth credentials
3. Add to Supabase provider settings
4. Test Google login

---

## 🔍 Testing Checklist

### Email/Password Flow
- [ ] Can create new account with email + password
- [ ] Can sign in with registered email
- [ ] Can sign out
- [ ] Can access admin dashboard after login
- [ ] Profile data saves correctly
- [ ] File uploads work
- [ ] Theme settings save

### Google OAuth Flow (After Setup)
- [ ] Google button is clickable
- [ ] Redirects to Google login page
- [ ] Returns to `/admin-mrwain` after auth
- [ ] Creates profile automatically
- [ ] Dashboard loads correctly

### Dashboard Features
- [ ] Logo upload works
- [ ] Avatar upload works
- [ ] Background upload works
- [ ] Theme colors apply
- [ ] Can delete uploaded images
- [ ] Can see file URLs

---

## 📝 Current Test Credentials

For testing, use any email format:
```
test@gmail.com (or any email)
password: test123456
```

**Note:** First signup requires email verification (check spam folder)

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "This email is already registered" | Use a different email or sign in instead |
| Password error | Password must be 6+ characters |
| Google button doesn't work | Configure Google OAuth per setup guide |
| Profile data not saving | Check Supabase RLS policies |
| File upload fails | Check storage bucket permissions |

---

## 📊 File Structure

- **Page:** `src/pages/AdminMrwain.tsx`
- **Components:** UI components from `/components/ui/`
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (logos, avatars, backgrounds)
- **Database:** Supabase Postgres (profiles table)

---

## 🚀 Next Steps

1. **Short term:** Test email/password flow thoroughly
2. **Medium term:** Configure Google OAuth (see setup guide)
3. **Long term:** Add additional admin features as needed

---

**Last Updated:** January 18, 2026  
**Status:** Email/Password ✅ | Google OAuth ⏳ (Needs Setup)
