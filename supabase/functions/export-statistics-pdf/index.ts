import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportData {
  kpiData: {
    totalMissions: number;
    completedMissions: number;
    totalFlightHours: number;
    incidentRate: number;
    activeResources: number;
  };
  missionsByMonth: Array<{ month: string; count: number }>;
  missionsByStatus: Array<{ name: string; value: number }>;
  missionsByRisk: Array<{ name: string; value: number }>;
  incidentsByMonth: Array<{ month: string; count: number }>;
  incidentsByCategory: Array<{ name: string; value: number }>;
  incidentsBySeverity: Array<{ name: string; value: number }>;
  daysSinceLastSevere: number;
  droneStatus: Array<{ name: string; value: number }>;
  equipmentStatus: Array<{ name: string; value: number }>;
  expiringDocs: { thirtyDays: number; sixtyDays: number; ninetyDays: number };
  timePeriod: string;
  companyName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    console.log('User auth result:', { hasUser: !!user, hasError: !!userError });
    
    if (userError) {
      console.error('Auth error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const data: ExportData = await req.json();

    console.log('Generating PDF report for user:', user.id);

    // Create HTML content for PDF
    const htmlContent = generateHTMLReport(data);

    // Convert HTML to PDF using a simple approach
    // In production, you might want to use a more robust PDF generation library
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #374151;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .kpi-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
    }
    .kpi-label {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .kpi-value {
      font-size: 32px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .kpi-subtitle {
      color: #9ca3af;
      font-size: 12px;
      margin-top: 5px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .data-table th,
    .data-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    .data-table tr:hover {
      background: #f9fafb;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
      text-align: center;
    }
    .period-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;

    return new Response(pdfContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="statistikk-rapport-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateHTMLReport(data: ExportData): string {
  const periodLabel = data.timePeriod === 'month' ? 'Siste måned' : 
                      data.timePeriod === 'quarter' ? 'Siste kvartal' : 'Siste år';
  
  const completionRate = data.kpiData.totalMissions > 0
    ? ((data.kpiData.completedMissions / data.kpiData.totalMissions) * 100).toFixed(1)
    : "0";

  return `
    <h1>${data.companyName} - Statistikkrapport <span class="period-badge">${periodLabel}</span></h1>
    <p style="color: #6b7280; margin-bottom: 30px;">Generert: ${new Date().toLocaleDateString('nb-NO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>

    <h2>📊 Nøkkeltall (KPI)</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Totale oppdrag</div>
        <div class="kpi-value">${data.kpiData.totalMissions}</div>
        <div class="kpi-subtitle">${completionRate}% fullført</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Totale flyvetimer</div>
        <div class="kpi-value">${data.kpiData.totalFlightHours}</div>
        <div class="kpi-subtitle">timer</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Hendelsesfrekvens</div>
        <div class="kpi-value">${data.kpiData.incidentRate.toFixed(2)}</div>
        <div class="kpi-subtitle">per 100 flyvetimer</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Aktive ressurser</div>
        <div class="kpi-value">${data.kpiData.activeResources}</div>
        <div class="kpi-subtitle">droner og utstyr</div>
      </div>
    </div>

    <h2>🚁 Oppdrag per måned</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Måned</th>
          <th>Antall oppdrag</th>
        </tr>
      </thead>
      <tbody>
        ${data.missionsByMonth.map(item => `
          <tr>
            <td>${item.month}</td>
            <td>${item.count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>📋 Oppdrag per status</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Antall</th>
        </tr>
      </thead>
      <tbody>
        ${data.missionsByStatus.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>⚠️ Oppdrag per risikonivå</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Risikonivå</th>
          <th>Antall</th>
        </tr>
      </thead>
      <tbody>
        ${data.missionsByRisk.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>🚨 Hendelser per måned</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Måned</th>
          <th>Antall hendelser</th>
        </tr>
      </thead>
      <tbody>
        ${data.incidentsByMonth.map(item => `
          <tr>
            <td>${item.month}</td>
            <td>${item.count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>📂 Hendelser per kategori</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Kategori</th>
          <th>Antall</th>
        </tr>
      </thead>
      <tbody>
        ${data.incidentsByCategory.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>🎯 Hendelser per alvorlighetsgrad</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Alvorlighetsgrad</th>
          <th>Antall</th>
        </tr>
      </thead>
      <tbody>
        ${data.incidentsBySeverity.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>🛡️ Sikkerhetsinformasjon</h2>
    <div class="kpi-card">
      <div class="kpi-label">Dager siden siste alvorlige hendelse</div>
      <div class="kpi-value">${data.daysSinceLastSevere === 999 ? 'Ingen registrert' : data.daysSinceLastSevere}</div>
    </div>

    <h2>🚁 Dronestatus</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Antall</th>
        </tr>
      </thead>
      <tbody>
        ${data.droneStatus.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>📦 Utstyrstatus</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Antall</th>
        </tr>
      </thead>
      <tbody>
        ${data.equipmentStatus.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>📄 Dokumenter som utløper snart</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Tidsperiode</th>
          <th>Antall dokumenter</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Innen 30 dager</td>
          <td>${data.expiringDocs.thirtyDays}</td>
        </tr>
        <tr>
          <td>Innen 60 dager</td>
          <td>${data.expiringDocs.sixtyDays}</td>
        </tr>
        <tr>
          <td>Innen 90 dager</td>
          <td>${data.expiringDocs.ninetyDays}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>Denne rapporten er generert automatisk fra ${data.companyName} sitt statistikksystem.</p>
      <p>For spørsmål om rapporten, vennligst kontakt systemadministrator.</p>
    </div>
  `;
}
