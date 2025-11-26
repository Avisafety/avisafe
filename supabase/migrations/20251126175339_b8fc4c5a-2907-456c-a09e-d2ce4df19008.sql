-- Insert default templates for new template types
INSERT INTO public.email_templates (company_id, template_type, subject, content)
SELECT 
  id,
  'user_approved',
  'Din bruker hos {{company_name}} er godkjent',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container { 
        max-width: 600px; 
        margin: 20px auto; 
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .content { 
        padding: 30px; 
      }
      .footer { 
        background: #f9f9f9;
        padding: 20px 30px;
        text-align: center; 
        font-size: 12px; 
        color: #888;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <h2>Velkommen {{user_name}}!</h2>
        <p>Din bruker hos <strong>{{company_name}}</strong> har blitt godkjent.</p>
        <p>Du kan nå logge inn og bruke systemet.</p>
      </div>
      <div class="footer">
        <p>Med vennlig hilsen,<br>{{company_name}}</p>
        <p style="font-size: 11px; color: #aaa;">Dette er en automatisk generert e-post. Vennligst ikke svar på denne e-posten.</p>
      </div>
    </div>
  </body>
</html>'
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates 
  WHERE email_templates.company_id = companies.id 
  AND email_templates.template_type = 'user_approved'
);

INSERT INTO public.email_templates (company_id, template_type, subject, content)
SELECT 
  id,
  'mission_confirmation',
  'Oppdragsbekreftelse - {{mission_title}}',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container { 
        max-width: 600px; 
        margin: 20px auto; 
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .content { 
        padding: 30px; 
      }
      .info-box {
        background: #f9f9f9;
        border-left: 4px solid #667eea;
        padding: 15px;
        margin: 20px 0;
      }
      .footer { 
        background: #f9f9f9;
        padding: 20px 30px;
        text-align: center; 
        font-size: 12px; 
        color: #888;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <h2>Oppdragsbekreftelse</h2>
        <p>Dette er en bekreftelse på oppdrag: <strong>{{mission_title}}</strong></p>
        <div class="info-box">
          <p><strong>Lokasjon:</strong> {{mission_location}}</p>
          <p><strong>Tidspunkt:</strong> {{mission_date}}</p>
          <p><strong>Status:</strong> {{mission_status}}</p>
        </div>
        <p>Hvis du har spørsmål, ta gjerne kontakt med oss.</p>
      </div>
      <div class="footer">
        <p>Med vennlig hilsen,<br>{{company_name}}</p>
        <p style="font-size: 11px; color: #aaa;">Dette er en automatisk generert e-post. Vennligst ikke svar på denne e-posten.</p>
      </div>
    </div>
  </body>
</html>'
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates 
  WHERE email_templates.company_id = companies.id 
  AND email_templates.template_type = 'mission_confirmation'
);

INSERT INTO public.email_templates (company_id, template_type, subject, content)
SELECT 
  id,
  'document_reminder',
  'Påminnelse: Dokument utgår snart - {{document_title}}',
  '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: Arial, sans-serif; 
        line-height: 1.6; 
        color: #333; 
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container { 
        max-width: 600px; 
        margin: 20px auto; 
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .content { 
        padding: 30px; 
      }
      .warning-box {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 15px;
        margin: 20px 0;
      }
      .footer { 
        background: #f9f9f9;
        padding: 20px 30px;
        text-align: center; 
        font-size: 12px; 
        color: #888;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <h2>Dokumentpåminnelse</h2>
        <p>Dette er en påminnelse om at følgende dokument utgår snart:</p>
        <div class="warning-box">
          <p><strong>Dokument:</strong> {{document_title}}</p>
          <p><strong>Utgår:</strong> {{expiry_date}}</p>
        </div>
        <p>Vennligst sørg for å fornye eller oppdatere dokumentet.</p>
      </div>
      <div class="footer">
        <p>Med vennlig hilsen,<br>{{company_name}}</p>
        <p style="font-size: 11px; color: #aaa;">Dette er en automatisk generert e-post. Vennligst ikke svar på denne e-posten.</p>
      </div>
    </div>
  </body>
</html>'
FROM public.companies
WHERE NOT EXISTS (
  SELECT 1 FROM public.email_templates 
  WHERE email_templates.company_id = companies.id 
  AND email_templates.template_type = 'document_reminder'
);