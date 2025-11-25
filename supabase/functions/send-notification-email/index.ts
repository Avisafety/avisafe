import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipientId?: string;
  notificationType: 'email_new_incident' | 'email_new_mission' | 'email_document_expiry' | 'email_new_user_pending' | 'email_followup_assigned';
  subject?: string;
  htmlContent?: string;
  // For new user notifications
  type?: 'notify_admins_new_user';
  companyId?: string;
  newUser?: {
    fullName: string;
    email: string;
    companyName: string;
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { recipientId, notificationType, subject, htmlContent, type, companyId, newUser }: EmailRequest = await req.json();

    // Handle new user admin notification mode
    if (type === 'notify_admins_new_user' && companyId && newUser) {
      console.log(`Finding admins for new user notification in company ${companyId}`);

      // Find all admins in the company with notifications enabled
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;
      if (!adminRoles || adminRoles.length === 0) {
        console.log('No admin roles found');
        return new Response(
          JSON.stringify({ message: 'No admins found' }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const adminUserIds = adminRoles.map(role => role.user_id);

      // Get profiles for admins in the same company
      const { data: adminProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('company_id', companyId)
        .in('id', adminUserIds);

      if (profilesError) throw profilesError;
      if (!adminProfiles || adminProfiles.length === 0) {
        console.log('No admin profiles found in company');
        return new Response(
          JSON.stringify({ message: 'No admins in this company' }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const companyAdminIds = adminProfiles.map(profile => profile.id);

      // Get notification preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .in('user_id', companyAdminIds)
        .eq('email_new_user_pending', true);

      if (prefsError) throw prefsError;
      if (!preferences || preferences.length === 0) {
        console.log('No admins with notifications enabled');
        return new Response(
          JSON.stringify({ message: 'No admins with notifications enabled' }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate HTML content
      const html = `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
.content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
.user-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #1e40af; }
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>Ny bruker venter på godkjenning</h1>
</div>
<div class="content">
<p>En ny bruker har registrert seg og venter på godkjenning.</p>
<div class="user-info">
<p><strong>Navn:</strong> ${newUser.fullName}</p>
<p><strong>E-post:</strong> ${newUser.email}</p>
<p><strong>Selskap:</strong> ${newUser.companyName}</p>
</div>
<p style="margin-top: 20px;">Logg inn i Avisafe for å godkjenne eller avslå denne brukeren.</p>
</div>
</div>
</body>
</html>`;

      const client = new SMTPClient({
        connection: {
          hostname: Deno.env.get("EMAIL_HOST") ?? "",
          port: parseInt(Deno.env.get("EMAIL_PORT") ?? "587"),
          tls: Deno.env.get("EMAIL_SECURE") === "true",
          auth: {
            username: Deno.env.get("EMAIL_USER") ?? "",
            password: Deno.env.get("EMAIL_PASS") ?? "",
          },
        },
      });

      // Send email to each admin
      let sentCount = 0;
      for (const pref of preferences) {
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(pref.user_id);
        
        if (userError || !user?.email) {
          console.error(`Could not get email for user ${pref.user_id}`);
          continue;
        }

        console.log(`Sending new user notification to ${user.email}`);

        await client.send({
          from: Deno.env.get("EMAIL_USER") ?? "",
          to: user.email,
          subject: 'Ny bruker venter på godkjenning',
          content: html,
          html: html,
        });
        sentCount++;
      }

      await client.close();

      console.log(`Sent ${sentCount} notification emails`);

      return new Response(
        JSON.stringify({ message: `Sent ${sentCount} notifications` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Original single-recipient flow
    if (!recipientId || !subject || !htmlContent) {
      throw new Error('Missing required fields for single recipient email');
    }

    console.log(`Processing notification for user ${recipientId}, type: ${notificationType}`);

    // 1. Check notification preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", recipientId)
      .maybeSingle();

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
      throw prefsError;
    }

    if (!prefs || !prefs[notificationType]) {
      console.log(`User has disabled notification type: ${notificationType}`);
      return new Response(
        JSON.stringify({ message: "User has disabled this notification type" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get user's email address
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(recipientId);
    
    if (userError || !user?.email) {
      console.error("Error fetching user or email not found:", userError);
      throw new Error("User email not found");
    }

    console.log(`Sending email to ${user.email}`);

    // 3. Send email via SMTP
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get("EMAIL_HOST") ?? "",
        port: parseInt(Deno.env.get("EMAIL_PORT") ?? "587"),
        tls: Deno.env.get("EMAIL_SECURE") === "true",
        auth: {
          username: Deno.env.get("EMAIL_USER") ?? "",
          password: Deno.env.get("EMAIL_PASS") ?? "",
        },
      },
    });

    await client.send({
      from: Deno.env.get("EMAIL_USER") ?? "",
      to: user.email,
      subject: subject,
      content: htmlContent,
      html: htmlContent,
    });

    await client.close();

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
