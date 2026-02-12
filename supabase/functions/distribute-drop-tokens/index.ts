// @ts-ignore - Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - ESM module (available at runtime)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This is a placeholder for DROP token distribution
// In production, this would integrate with your token distribution script

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientAddress, amount = '100' } = await req.json()

    // Validate input
    if (!recipientAddress) {
      return new Response(
        JSON.stringify({ error: 'Recipient address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate Pi mainnet address format (basic check)
    if (!recipientAddress.startsWith('G') || recipientAddress.length !== 56) {
      return new Response(
        JSON.stringify({ error: 'Invalid Pi wallet address format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // In a real implementation, you would:
    // 1. Verify the user is authenticated
    // 2. Check if they're eligible for tokens (rate limiting, etc.)
    // 3. Call your Node.js script to distribute tokens
    // 4. Use the Stellar SDK to create and submit the transaction
    // 5. Store the transaction in your database

    console.log(`DROP token distribution requested:`)
    console.log(`Recipient: ${recipientAddress}`)
    console.log(`Amount: ${amount}`)

    // Simulate successful distribution
    const txHash = `drop_distribution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Log the distribution request
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store distribution record (optional)
    try {
      await supabase
        .from('token_distributions')
        .insert({
          recipient_address: recipientAddress,
          amount: parseFloat(amount),
          token_code: 'DROP',
          transaction_hash: txHash,
          status: 'simulated' // In production, this would be 'completed'
        })
    } catch (dbError) {
      console.error('Failed to log distribution:', dbError)
      // Continue anyway since this is just logging
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        transactionHash: txHash,
        amount,
        recipient: recipientAddress,
        message: 'DROP tokens distributed successfully (simulated)'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in DROP token distribution:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to distribute DROP tokens'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
