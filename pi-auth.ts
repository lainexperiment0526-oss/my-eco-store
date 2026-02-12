import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { secureLog } from './utils/secureLogging.js';

dotenv.config();

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.post('/pi-auth', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    console.log('Verifying Pi access token...');

    const piApiKey = process.env.PI_API_KEY;
    if (!piApiKey) {
      secureLog.error('PI_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error: PI_API_KEY missing' });
    }

    // Verify the access token with Pi servers
    const verifyResponse = await fetch('https://api.minepi.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('Pi verification failed:', errorText);
      return res.status(400).json({ error: `Pi verification failed: ${verifyResponse.status}` });
    }

    const piUser = await verifyResponse.json() as { username: string; uid: string };
    console.log('Pi user verified:', piUser.username, 'uid:', piUser.uid);

    // Create Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase environment variables missing' });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const email = `${piUser.uid}@pi.network`;
    let userId: string | null = null;
    let profileId: string | null = null;

    // Try to find existing auth user by email
    console.log('Looking for existing user with email:', email);
    const { data: existingUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
      console.log('Found existing auth user:', userId);
    } else {
      // Create new auth user
      console.log('Creating new auth user for:', email);
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          pi_username: piUser.username,
          pi_uid: piUser.uid,
        },
      });

      if (createError) {
        console.error('Failed to create auth user:', createError);
        return res.status(500).json({ error: createError.message || createError });
      }

      userId = newAuthUser.user.id;
      console.log('Created new auth user:', userId);
    }

    // Check for existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, subscription_plan')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
      console.log('Found existing profile:', profileId);
    } else {
      // Also check by username
      const { data: profileByUsername } = await supabase
        .from('profiles')
        .select('id, user_id, subscription_plan')
        .eq('username', piUser.username)
        .maybeSingle();

      if (profileByUsername) {
        profileId = profileByUsername.id;
        // Update user_id if not set
        if (!profileByUsername.user_id) {
          await supabase
            .from('profiles')
            .update({ user_id: userId })
            .eq('id', profileId);
        }
        console.log('Found profile by username:', profileId);
      } else {
        // Create new profile with free plan
        console.log('Creating new profile for user:', userId);
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username: piUser.username,
            business_name: piUser.username,
            subscription_plan: 'free',
          })
          .select('id')
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Try to fetch if it was a duplicate
          const { data: fetchedProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          profileId = fetchedProfile?.id || null;
        } else {
          profileId = newProfile.id;
        }
        console.log('Profile created/found:', profileId);
      }
    }

    // Generate session token for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError) {
      console.error('Failed to generate session:', sessionError);
      return res.status(500).json({ error: sessionError.message || sessionError });
    }

    console.log('Authentication successful for:', piUser.username);

    return res.json({
      success: true,
      user: {
        username: piUser.username,
        uid: piUser.uid,
      },
      profileId,
      sessionToken: sessionData.properties.action_link,
    });
  } catch (error) {
    console.error('Error in pi-auth:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(400).json({ error: errorMessage });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
