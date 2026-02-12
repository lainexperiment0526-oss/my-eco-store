-- Create the messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender UUID REFERENCES profiles (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Grant permissions for inserting and selecting messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users" ON messages
    FOR INSERT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow select for authenticated users" ON messages
    FOR SELECT
    USING (auth.uid() IS NOT NULL);