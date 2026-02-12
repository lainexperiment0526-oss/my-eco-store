-- ============================================
-- Voting System Database Schema
-- Deploy this to Supabase SQL Editor
-- ============================================

-- Create feature_requests table
CREATE TABLE IF NOT EXISTS feature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'feature',
    status VARCHAR(20) NOT NULL DEFAULT 'proposed',
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feature_votes table
CREATE TABLE IF NOT EXISTS feature_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, feature_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_by ON feature_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_votes_user_id ON feature_votes(user_id);

-- Enable RLS
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Authenticated users can create feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Users can update their own feature requests" ON feature_requests;
DROP POLICY IF EXISTS "Anyone can read votes" ON feature_votes;
DROP POLICY IF EXISTS "Authenticated users can vote" ON feature_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON feature_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON feature_votes;

-- RLS Policies for feature_requests
CREATE POLICY "Anyone can read feature requests" ON feature_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create feature requests" ON feature_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own feature requests" ON feature_requests FOR UPDATE USING (created_by = (SELECT id FROM profiles WHERE id = auth.uid()));

-- RLS Policies for feature_votes
CREATE POLICY "Anyone can read votes" ON feature_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON feature_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own votes" ON feature_votes FOR UPDATE USING (user_id = (SELECT id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can delete their own votes" ON feature_votes FOR DELETE USING (user_id = (SELECT id FROM profiles WHERE id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_feature_requests_updated_at ON feature_requests;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_feature_requests_updated_at 
    BEFORE UPDATE ON feature_requests 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert sample features for testing (optional)
INSERT INTO feature_requests (title, description, category, status, created_by)
SELECT 
    'Dark Mode Theme',
    'Add a beautiful dark mode theme option for better user experience in low-light environments',
    'ui',
    'proposed',
    (SELECT id FROM profiles LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM feature_requests WHERE title = 'Dark Mode Theme'
);

INSERT INTO feature_requests (title, description, category, status, created_by)
SELECT 
    'Mobile App',
    'Create native mobile apps for iOS and Android to manage bio pages on the go',
    'platform',
    'in_progress',
    (SELECT id FROM profiles LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM feature_requests WHERE title = 'Mobile App'
);

INSERT INTO feature_requests (title, description, category, status, created_by)
SELECT 
    'Advanced Analytics Dashboard',
    'Enhanced analytics with real-time visitor tracking, geographic data, and device information',
    'analytics',
    'proposed',
    (SELECT id FROM profiles LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM feature_requests WHERE title = 'Advanced Analytics Dashboard'
);

INSERT INTO feature_requests (title, description, category, status, created_by)
SELECT 
    'Social Media Auto-Posting',
    'Automatically share updates across multiple social media platforms when you update your bio',
    'integration',
    'proposed',
    (SELECT id FROM profiles LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM feature_requests WHERE title = 'Social Media Auto-Posting'
);

-- Verification queries
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('feature_requests', 'feature_votes');
SELECT COUNT(*) as feature_count FROM feature_requests;
SELECT COUNT(*) as vote_count FROM feature_votes;
