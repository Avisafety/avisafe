import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  recipientId: string;
  notificationType: 'email_new_incident' | 'email_new_mission' | 'email_document_expiry' | 'email_new_user_pending' | 'email_followup_assigned';
  subject: string;
  htmlContent: string;
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

    const { recipientId, notificationType, subject, htmlContent }: EmailRequest = await req.json();

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
