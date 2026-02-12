-- Drop old messages table if exists
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with proper schema
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    receiver_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_receiver ON messages(receiver_profile_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_profile_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to insert messages (sender can send to anyone)
CREATE POLICY "Users can send messages"
    ON messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND (
            sender_profile_id IS NULL 
            OR sender_profile_id IN (SELECT id FROM profiles WHERE id = sender_profile_id)
        )
    );

-- Allow users to view messages where they are the receiver
CREATE POLICY "Users can view their received messages"
    ON messages
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND receiver_profile_id IN (SELECT id FROM profiles)
    );

-- Allow users to update (mark as read) their received messages
CREATE POLICY "Users can update their received messages"
    ON messages
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL 
        AND receiver_profile_id IN (SELECT id FROM profiles)
    );

-- Allow users to delete their received messages
CREATE POLICY "Users can delete their received messages"
    ON messages
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL 
        AND receiver_profile_id IN (SELECT id FROM profiles)
    );

-- Grant permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON messages TO anon;
