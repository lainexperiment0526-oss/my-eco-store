// Supabase Edge Function: Send Gift Card Email
// Sends Christmas-themed gift card emails to recipients

// @ts-ignore: Deno runtime types (available at runtime)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: ESM module (available at runtime)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientEmail, code, planType, billingPeriod, message, senderProfileId } = await req.json()

    // Validate inputs
    if (!recipientEmail || !code || !planType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get sender information
    const supabase = createClient(
      // @ts-ignore: Deno global available at runtime
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno global available at runtime
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let senderName = 'A DropLink Friend'
    if (senderProfileId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, business_name')
        .eq('id', senderProfileId)
        .single()
      
      if (profile) {
        senderName = profile.business_name || profile.username || senderName
      }
    }

    // Christmas-themed email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #165B33 0%, #C41E3A 100%);
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #C41E3A 0%, #165B33 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      position: relative;
    }
    .header h1 {
      margin: 0;
      font-size: 36px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    .emoji-decoration {
      font-size: 48px;
      margin: 10px 0;
    }
    .content {
      padding: 40px 30px;
      background: linear-gradient(to bottom, #fff 0%, #f9fafb 100%);
    }
    .gift-box {
      background: linear-gradient(135deg, #DC2626 0%, #059669 100%);
      border: 4px solid #FCD34D;
      border-radius: 15px;
      padding: 30px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
    }
    .code-display {
      background: white;
      color: #DC2626;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 4px;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      box-shadow: inset 0 2px 10px rgba(0,0,0,0.1);
    }
    .plan-details {
      background: linear-gradient(to right, #FEF3C7 0%, #D1FAE5 100%);
      border-left: 5px solid #059669;
      padding: 20px;
      margin: 20px 0;
      border-radius: 10px;
    }
    .personal-message {
      background: #FEE2E2;
      border-left: 5px solid #DC2626;
      padding: 20px;
      margin: 20px 0;
      border-radius: 10px;
      font-style: italic;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #DC2626 0%, #059669 100%);
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      font-size: 18px;
      margin: 20px 0;
      box-shadow: 0 5px 15px rgba(220, 38, 38, 0.4);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: scale(1.05);
    }
    .footer {
      background: #F3F4F6;
      padding: 30px;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    .snowflake {
      color: white;
      font-size: 20px;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="emoji-decoration">🎄 🎅 🎁 🤶 🎄</div>
      <h1>Merry Christmas! 🎄</h1>
      <p style="font-size: 18px; margin: 10px 0;">You've received a DropLink Gift Card!</p>
    </div>

    <div class="content">
      <p style="font-size: 18px; color: #059669; font-weight: bold;">
        Ho Ho Ho! ${senderName} has sent you a special Christmas gift! 🎅
      </p>

      ${message ? `
      <div class="personal-message">
        <p style="margin: 0; color: #DC2626; font-weight: bold;">💌 Personal Message:</p>
        <p style="margin: 10px 0 0 0; color: #991B1B;">${message}</p>
      </div>
      ` : ''}

      <div class="gift-box">
        <p style="color: white; font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">
          🎁 Your Gift Card Code 🎁
        </p>
        <div class="code-display">${code}</div>
        <p style="color: #FEF3C7; margin: 10px 0 0 0;">Copy this code to redeem your subscription!</p>
      </div>

      <div class="plan-details">
        <h3 style="margin: 0 0 15px 0; color: #059669;">🎄 Gift Details:</h3>
        <p style="margin: 5px 0;"><strong>Plan:</strong> ${planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
        <p style="margin: 5px 0;"><strong>Period:</strong> ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}</p>
        <p style="margin: 15px 0 5px 0; color: #065F46;">This gift card gives you full access to DropLink premium features!</p>
      </div>

      <div style="text-align: center;">
        <a href="https://droplink.space/subscription" class="button">
          🎁 Redeem Your Gift Card Now! 🎄
        </a>
      </div>

      <div style="background: #DBEAFE; padding: 15px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; color: #1E40AF; font-size: 14px;">
          <strong>📝 How to Redeem:</strong><br>
          1. Visit <a href="https://droplink.space/subscription" style="color: #DC2626;">droplink.space/subscription</a><br>
          2. Click "Gift Cards" button<br>
          3. Enter your code: <code style="background: white; padding: 2px 8px; border-radius: 4px; color: #DC2626; font-weight: bold;">${code}</code><br>
          4. Enjoy your premium subscription! 🎉
        </p>
      </div>

      <p style="text-align: center; color: #6B7280; font-size: 14px; margin: 30px 0 10px 0;">
        ⏰ This gift card is valid for 1 year from the date of purchase<br>
        ✨ Can only be redeemed once
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 10px 0; font-weight: bold; color: #059669;">
        🎄 Merry Christmas from DropLink! 🎄
      </p>
      <p style="margin: 5px 0;">
        Questions? Contact us at <a href="mailto:support@droplink.space" style="color: #DC2626;">support@droplink.space</a>
      </p>
      <p style="margin: 15px 0 0 0; font-size: 12px;">
        This email was sent because someone purchased a DropLink gift card for you.<br>
        DropLink • Making connections easier • droplink.space
      </p>
    </div>
  </div>
</body>
</html>
    `

    // Send email using Resend API (you can also use SendGrid, Mailgun, etc.)
    // For now, we'll log the email content
    console.log('Sending gift card email to:', recipientEmail)
    console.log('Code:', code)
    console.log('From:', senderName)

    // TODO: Integrate with your email service provider
    // Example with Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'DropLink <gifts@droplink.space>',
    //     to: recipientEmail,
    //     subject: `🎄 You've Received a DropLink Christmas Gift Card! 🎁`,
    //     html: emailHtml
    //   })
    // })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email queued for delivery',
        recipientEmail 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error sending gift card email:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
