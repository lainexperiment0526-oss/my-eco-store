const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Try to load .env.production, then .env.droplink.pi, then .env
const envProduction = path.resolve(__dirname, '.env.production');
const envDroplink = path.resolve(__dirname, '.env.droplink.pi');

if (fs.existsSync(envProduction)) {
    console.log(`Loading env from ${envProduction}`);
    dotenv.config({ path: envProduction });
} else if (fs.existsSync(envDroplink)) {
    console.log(`Loading env from ${envDroplink}`);
    dotenv.config({ path: envDroplink });
} else {
    console.log('Loading env from default .env');
    dotenv.config();
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    console.log('🚀 Starting Backend Verification...');
    console.log(`📡 Connecting to Supabase at ${SUPABASE_URL}`);

    // 1. Verify Profiles Table
    console.log('\n🔍 Verifying Profiles Table...');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .limit(5);

    if (profilesError) {
        console.error('❌ Profiles Table Check Failed:', profilesError.message);
    } else {
        console.log(`✅ Profiles Table OK. Found ${profiles.length} profiles.`);
        if (profiles.length > 0) {
            console.log('   Sample profiles:', profiles.map(p => p.username).join(', '));
        }
    }

    // 2. Verify Messages Table (Inbox)
    console.log('\n🔍 Verifying Messages Table (Inbox)...');
    // First check if table exists and has correct columns by trying to select them
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, sender_profile_id, receiver_profile_id, content, is_read')
        .limit(1);

    if (messagesError) {
        console.error('❌ Messages Table Check Failed:', messagesError.message);
    } else {
        console.log('✅ Messages Table OK (Schema matches expected columns).');
    }

    // 3. Inbox Workflow Simulation
    console.log('\n🔄 Simulating Inbox Workflow...');
    if (profiles && profiles.length > 0) {
        const receiver = profiles[0];
        const senderId = profiles.length > 1 ? profiles[1].id : null; // Use another profile as sender if available, else null (anon)

        console.log(`   📝 Sending test message to ${receiver.username} (${receiver.id})...`);
        
        const testContent = `Test message ${Date.now()}`;
        const { data: sentMsg, error: sendError } = await supabase
            .from('messages')
            .insert({
                receiver_profile_id: receiver.id,
                sender_profile_id: senderId,
                content: testContent,
                is_read: false
            })
            .select()
            .single();

        if (sendError) {
            console.error('❌ Failed to send message:', sendError.message);
        } else {
            console.log('✅ Message sent successfully.');
            console.log(`   Message ID: ${sentMsg.id}`);

            // Verify receiving
            console.log('   👀 Verifying message receipt...');
            const { data: receivedMsg, error: receiveError } = await supabase
                .from('messages')
                .select('*')
                .eq('id', sentMsg.id)
                .single();

            if (receiveError) {
                console.error('❌ Failed to retrieve message:', receiveError.message);
            } else {
                if (receivedMsg.content === testContent) {
                    console.log('✅ Message retrieved and content matches.');
                } else {
                    console.error('❌ Message retrieved but content mismatch.');
                }
            }

            // Cleanup
            console.log('   🧹 Cleaning up test message...');
            const { error: deleteError } = await supabase
                .from('messages')
                .delete()
                .eq('id', sentMsg.id);
            
            if (deleteError) {
                console.warn('⚠️ Failed to delete test message:', deleteError.message);
            } else {
                console.log('✅ Test message deleted.');
            }
        }
    } else {
        console.log('⚠️ Skipping Inbox Workflow simulation because no profiles were found.');
    }

    // 4. Verify User Wallets (Backend)
    console.log('\n🔍 Verifying User Wallets...');
    const { data: wallets, error: walletsError } = await supabase
        .from('user_wallets')
        .select('id, drop_tokens')
        .limit(1);

    if (walletsError) {
        console.error('❌ User Wallets Table Check Failed:', walletsError.message);
    } else {
        console.log('✅ User Wallets Table OK.');
    }
    
    // 5. Verify Subscriptions (Workflow)
    console.log('\n🔍 Verifying Subscriptions Table...');
    const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('id, plan_type, status')
        .limit(1);

    if (subsError) {
        // Subscriptions might not exist if it's a new feature not yet migrated, but check
        console.warn('⚠️ Subscriptions Table Check Warning:', subsError.message);
    } else {
        console.log('✅ Subscriptions Table OK.');
    }

    console.log('\n🏁 Verification Complete.');
}

verify().catch(err => {
    console.error('❌ Unexpected Error:', err);
});
