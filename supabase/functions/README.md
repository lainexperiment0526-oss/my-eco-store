# Supabase Edge Functions

These are Deno-based edge functions for Supabase.

## TypeScript Errors in IDE

If you see TypeScript errors in your IDE about:
- `Cannot find module 'https://deno.land/std@...'`
- `Cannot find name 'Deno'`

These are **expected** and **not actual errors**. The code runs correctly in the Deno runtime on Supabase.

### To Fix IDE Errors (Optional)

1. Install the Deno VS Code extension:
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Deno" by Deno Land
   - Install it

2. Enable Deno for this workspace:
   - The `.vscode/settings.json` file should automatically enable Deno
   - Or manually add: `"deno.enable": true` to your VS Code settings

3. Reload VS Code window:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Reload Window"
   - Select "Developer: Reload Window"

### Note

These functions are designed to run in the Deno runtime on Supabase's infrastructure, not in Node.js. The TypeScript errors you see are because your local IDE doesn't have Deno types configured, but the code will work perfectly when deployed to Supabase.

## Functions

- `pi-auth`: Handles Pi Network authentication and profile creation
- `pi-payment-approve`: Approves Pi payments
- `pi-payment-complete`: Completes Pi payments
- `profile-update`: Securely updates user profiles
- `financial-data`: Manages financial data (crypto wallets, bank details)
- `ai-chat`: Handles AI chat interactions
- `wallet-increment`: Securely increments wallet balances

