

CREATE TABLE IF NOT EXISTS stores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id bigint REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS followers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint REFERENCES auth.users(id) ON DELETE CASCADE,
    follower_id bigint REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(user_id, follower_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    ends_at TIMESTAMP WITH TIME ZONE
);

-- Add more tables as needed for wallet, domain, etc.
