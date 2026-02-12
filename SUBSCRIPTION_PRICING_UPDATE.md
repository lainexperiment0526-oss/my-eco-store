# 📋 Subscription Pricing Update

## New Pricing Structure (Effective November 21, 2025)

### **Updated Plans:**

| Plan | Monthly Price | Yearly Price | Yearly Discount |
|------|---------------|--------------|-----------------|
| **Free** | 0 Pi | 0 Pi | - |
| **Premium** | **10 Pi** | **96 Pi** | **20%** |
| **Pro** | **20 Pi** | **192 Pi** | **20%** |

### **Previous Pricing:**

| Plan | Monthly Price | Yearly Price | Change |
|------|---------------|--------------|---------|
| Premium | 20 Pi | 192 Pi | ✅ **50% reduction** |
| Pro | 30 Pi | 288 Pi | ✅ **33% reduction** |

## Changes Made

### **Frontend Updates:**
- ✅ Updated `src/pages/Subscription.tsx` with new pricing
- ✅ Updated pricing display and calculations

### **Documentation Updates:**
- ✅ Updated `DROPLINK_PI_WORKFLOW_COMPLETE.md` with new prices
- ✅ Updated plan price constants in documentation

### **Features Unchanged:**
- All plan features remain exactly the same
- Payment processing logic unchanged (uses dynamic amounts)
- Yearly discount calculation remains at 20%

## Yearly Discount Calculation

**Premium:**
- Monthly: 10 Pi × 12 = 120 Pi
- Yearly with 20% discount: 120 - 24 = **96 Pi**

**Pro:**
- Monthly: 20 Pi × 12 = 240 Pi  
- Yearly with 20% discount: 240 - 48 = **192 Pi**

## Impact

- **More accessible pricing** for Pi Network users
- **Better value proposition** for Premium plan users
- **Maintains yearly discount incentive**
- **No breaking changes** to existing functionality

---
*Updated: November 21, 2025*