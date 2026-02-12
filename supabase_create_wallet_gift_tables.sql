-- Create user_wallets table
-- Create user_wallets table
create table if not exists public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  drop_tokens numeric(20, 6) default 0 not null,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Create gift_transactions table
create table if not exists public.gift_transactions (
  id uuid primary key default gen_random_uuid(),
  sender_profile_id uuid references profiles(id) on delete set null,
  receiver_profile_id uuid references profiles(id) on delete set null,
  gift_id uuid references gifts(id) on delete set null,
  drop_tokens_spent numeric(20, 6) not null,
  pi_amount numeric(20, 6) default 0 not null,
  created_at timestamp with time zone default timezone('utc', now())
);
