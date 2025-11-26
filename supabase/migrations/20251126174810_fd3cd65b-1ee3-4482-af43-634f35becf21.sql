-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_type text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email templates in own company"
ON public.email_templates
FOR ALL
USING (
  has_role(auth.uid(), 'admin') 
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Superadmins can manage all email templates"
ON public.email_templates
FOR ALL
USING (is_superadmin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default customer welcome template
INSERT INTO public.email_templates (company_id, template_type, subject, content)
SELECT 
  id,
  'customer_welcome',
  'Velkommen som kunde hos {{company_name}}',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Velkommen som kunde!</h1>
      </div>
      <div class="content">
        <h2>Hei {{customer_name}}!</h2>
        <p>Vi er glade for å ønske deg velkommen som kunde hos <strong>{{company_name}}</strong>.</p>
        <p>Du er nå registrert i vårt system, og vi ser frem til å samarbeide med deg.</p>
        <p>Hvis du har spørsmål eller trenger hjelp, ta gjerne kontakt med oss.</p>
        <div class="footer">
          <p>Med vennlig hilsen,<br>{{company_name}}</p>
          <p style="font-size: 11px; color: #aaa;">Dette er en automatisk generert e-post. Vennligst ikke svar på denne e-posten.</p>
        </div>
      </div>
    </div>
  </body>
</html>'
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates 
  WHERE email_templates.company_id = companies.id 
  AND email_templates.template_type = 'customer_welcome'
);