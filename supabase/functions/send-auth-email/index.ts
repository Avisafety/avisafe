import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthEmailRequest {
  user: {
    id: string;
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const generatePasswordResetHTML = (resetUrl: string, token: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tilbakestill passord - AviSafe</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">AviSafe</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Tilbakestill passord</h2>
                    
                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      Hei,
                    </p>
                    
                    <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      Du har bedt om å tilbakestille passordet ditt for AviSafe. Klikk på knappen nedenfor for å opprette et nytt passord.
                    </p>
                    
                    <!-- Reset button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            Tilbakestill passord
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                      Eller kopier og lim inn denne koden:
                    </p>
                    
                    <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin: 0 0 30px 0; text-align: center;">
                      <code style="color: #667eea; font-size: 18px; font-weight: 600; letter-spacing: 2px;">${token}</code>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 20px;">
                      <p style="margin: 0; color: #888888; font-size: 14px; line-height: 1.6;">
                        Hvis du ikke ba om å tilbakestille passordet ditt, kan du trygt ignorere denne e-posten. Passordet ditt vil forbli uendret.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; color: #888888; font-size: 14px; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} AviSafe. Alle rettigheter forbeholdt.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const generateSignupHTML = (confirmUrl: string, token: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bekreft e-post - AviSafe</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">AviSafe</h1>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Velkommen til AviSafe!</h2>
                    
                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                      Takk for at du registrerte deg hos AviSafe. Vennligst bekreft e-postadressen din ved å klikke på knappen nedenfor.
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                            Bekreft e-post
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                      Eller kopier og lim inn denne koden:
                    </p>
                    
                    <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin: 0 0 30px 0; text-align: center;">
                      <code style="color: #667eea; font-size: 18px; font-weight: 600; letter-spacing: 2px;">${token}</code>
                    </div>
                  </td>
                </tr>
                
                <tr>
                  <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0; color: #888888; font-size: 14px; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} AviSafe. Alle rettigheter forbeholdt.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailRequest = await req.json();
    console.log('Received auth email request:', { 
      type: payload.email_data.email_action_type,
      email: payload.user.email 
    });

    const { user, email_data } = payload;
    const { token, token_hash, redirect_to, email_action_type, site_url } = email_data;

    // Build the appropriate URL based on email action type
    let actionUrl = '';
    let subject = '';
    let html = '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    switch (email_action_type) {
      case 'recovery':
        actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${redirect_to}`;
        subject = 'Tilbakestill passord - AviSafe';
        html = generatePasswordResetHTML(actionUrl, token);
        break;
      
      case 'signup':
      case 'invite':
        actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${redirect_to}`;
        subject = 'Bekreft e-post - AviSafe';
        html = generateSignupHTML(actionUrl, token);
        break;
      
      case 'magiclink':
        actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=magiclink&redirect_to=${redirect_to}`;
        subject = 'Logg inn på AviSafe';
        html = generateSignupHTML(actionUrl, token);
        break;
      
      case 'email_change':
        actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=email_change&redirect_to=${redirect_to}`;
        subject = 'Bekreft ny e-postadresse - AviSafe';
        html = generateSignupHTML(actionUrl, token);
        break;
      
      default:
        throw new Error(`Unsupported email action type: ${email_action_type}`);
    }

    // Get SMTP configuration
    const emailHost = Deno.env.get('EMAIL_HOST');
    const emailPort = parseInt(Deno.env.get('EMAIL_PORT') || '465');
    const emailUser = Deno.env.get('EMAIL_USER');
    const emailPass = Deno.env.get('EMAIL_PASS');
    const emailSecure = Deno.env.get('EMAIL_SECURE') === 'true';

    if (!emailHost || !emailUser || !emailPass) {
      throw new Error('Email configuration is incomplete');
    }

    console.log('Connecting to SMTP server:', { host: emailHost, port: emailPort, secure: emailSecure });

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: emailHost,
        port: emailPort,
        tls: emailSecure,
        auth: {
          username: emailUser,
          password: emailPass,
        },
      },
    });

    // Send email
    await client.send({
      from: emailUser,
      to: user.email,
      subject: subject,
      content: html,
      html: html,
    });

    console.log('Email sent successfully to:', user.email);

    await client.close();

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending auth email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
