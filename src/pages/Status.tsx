import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { GlassCard } from "@/components/GlassCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity, AlertTriangle, Clock, Package, Download } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface KPIData {
  totalMissions: number;
  completedMissions: number;
  totalFlightHours: number;
  incidentRate: number;
  activeResources: number;
}

interface MonthData {
  month: string;
  count: number;
}

interface StatusData {
  name: string;
  value: number;
}

const COLORS = {
  primary: "hsl(var(--primary))",
  destructive: "hsl(var(--destructive))",
  warning: "hsl(var(--status-yellow))",
  success: "hsl(var(--status-green))",
  muted: "hsl(var(--muted-foreground))",
};

const Status = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<"month" | "quarter" | "year">("year");
  const [kpiData, setKpiData] = useState<KPIData>({
    totalMissions: 0,
    completedMissions: 0,
    totalFlightHours: 0,
    incidentRate: 0,
    activeResources: 0,
  });
  const [missionsByMonth, setMissionsByMonth] = useState<MonthData[]>([]);
  const [missionsByStatus, setMissionsByStatus] = useState<StatusData[]>([]);
  const [missionsByRisk, setMissionsByRisk] = useState<StatusData[]>([]);
  const [incidentsByMonth, setIncidentsByMonth] = useState<MonthData[]>([]);
  const [incidentsByCategory, setIncidentsByCategory] = useState<StatusData[]>([]);
  const [incidentsBySeverity, setIncidentsBySeverity] = useState<StatusData[]>([]);
  const [daysSinceLastSevere, setDaysSinceLastSevere] = useState<number>(0);
  const [droneStatus, setDroneStatus] = useState<StatusData[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<StatusData[]>([]);
  const [flightHoursByDrone, setFlightHoursByDrone] = useState<any[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<{ thirtyDays: number; sixtyDays: number; ninetyDays: number }>({
    thirtyDays: 0,
    sixtyDays: 0,
    ninetyDays: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchAllStatistics();
  }, [user, navigate, timePeriod]);

  const fetchAllStatistics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKPIData(),
        fetchMissionStatistics(),
        fetchIncidentStatistics(),
        fetchResourceStatistics(),
        fetchDocumentStatistics(),
      ]);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timePeriod) {
      case "month":
        return subMonths(now, 1);
      case "quarter":
        return subMonths(now, 3);
      case "year":
        return subMonths(now, 12);
      default:
        return subMonths(now, 12);
    }
  };

  const fetchKPIData = async () => {
    const startDate = getDateFilter().toISOString();
    
    const { data: missions } = await supabase
      .from("missions")
      .select("status, tidspunkt")
      .gte("tidspunkt", startDate);
    const { data: drones } = await supabase.from("drones").select("flyvetimer, aktiv");
    const { data: equipment } = await supabase.from("equipment").select("aktiv");
    const { data: incidents } = await supabase
      .from("incidents")
      .select("*")
      .gte("hendelsestidspunkt", startDate);

    const totalMissions = missions?.length || 0;
    const completedMissions = missions?.filter((m) => m.status === "Fullført").length || 0;
    const totalFlightHours = drones?.reduce((sum, d) => sum + (d.flyvetimer || 0), 0) || 0;
    const activeDrones = drones?.filter((d) => d.aktiv).length || 0;
    const activeEquipment = equipment?.filter((e) => e.aktiv).length || 0;
    const incidentRate = totalFlightHours > 0 ? ((incidents?.length || 0) / totalFlightHours) * 100 : 0;

    setKpiData({
      totalMissions,
      completedMissions,
      totalFlightHours,
      incidentRate,
      activeResources: activeDrones + activeEquipment,
    });
  };

  const fetchMissionStatistics = async () => {
    const startDate = getDateFilter().toISOString();
    
    const { data: missions } = await supabase
      .from("missions")
      .select("tidspunkt, status, risk_nivå")
      .gte("tidspunkt", startDate) as any;

    if (!missions) return;

    // Missions by month (based on selected period)
    const monthsToShow = timePeriod === "month" ? 1 : timePeriod === "quarter" ? 3 : 12;
    const monthlyData: { [key: string]: number } = {};
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, "MMM yyyy", { locale: nb });
      monthlyData[monthKey] = 0;
    }

    missions.forEach((mission: any) => {
      const missionDate = new Date(mission.tidspunkt);
      const monthKey = format(missionDate, "MMM yyyy", { locale: nb });
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    setMissionsByMonth(
      Object.entries(monthlyData).map(([month, count]) => ({ month, count }))
    );

    // Missions by status
    const statusCounts: { [key: string]: number } = {};
    missions.forEach((m: any) => {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    });
    setMissionsByStatus(
      Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
    );

    // Missions by risk level
    const riskCounts: { [key: string]: number } = {};
    missions.forEach((m: any) => {
      riskCounts[m.risk_nivå] = (riskCounts[m.risk_nivå] || 0) + 1;
    });
    setMissionsByRisk(
      Object.entries(riskCounts).map(([name, value]) => ({ name, value }))
    );
  };

  const fetchIncidentStatistics = async () => {
    const startDate = getDateFilter().toISOString();
    
    const { data: incidents } = await supabase
      .from("incidents")
      .select("hendelsestidspunkt, kategori, alvorlighetsgrad")
      .gte("hendelsestidspunkt", startDate)
      .order("hendelsestidspunkt", { ascending: false });

    if (!incidents) return;

    // Incidents by month (based on selected period)
    const monthsToShow = timePeriod === "month" ? 1 : timePeriod === "quarter" ? 3 : 12;
    const monthlyData: { [key: string]: number } = {};
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, "MMM yyyy", { locale: nb });
      monthlyData[monthKey] = 0;
    }

    incidents.forEach((incident) => {
      const incidentDate = new Date(incident.hendelsestidspunkt);
      const monthKey = format(incidentDate, "MMM yyyy", { locale: nb });
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    setIncidentsByMonth(
      Object.entries(monthlyData).map(([month, count]) => ({ month, count }))
    );

    // Incidents by category
    const categoryCounts: { [key: string]: number } = {};
    incidents.forEach((i) => {
      const category = i.kategori || "Ukjent";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    setIncidentsByCategory(
      Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
    );

    // Incidents by severity
    const severityCounts: { [key: string]: number } = {};
    incidents.forEach((i) => {
      severityCounts[i.alvorlighetsgrad] = (severityCounts[i.alvorlighetsgrad] || 0) + 1;
    });
    setIncidentsBySeverity(
      Object.entries(severityCounts).map(([name, value]) => ({ name, value }))
    );

    // Days since last severe incident
    const severeIncident = incidents.find((i) => i.alvorlighetsgrad === "Alvorlig");
    if (severeIncident) {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(severeIncident.hendelsestidspunkt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      setDaysSinceLastSevere(daysSince);
    } else {
      setDaysSinceLastSevere(999);
    }
  };

  const fetchResourceStatistics = async () => {
    const { data: drones } = await supabase.from("drones").select("status, flyvetimer, modell, registrering");
    const { data: equipment } = await supabase.from("equipment").select("status");

    if (drones) {
      const statusCounts: { [key: string]: number } = {};
      drones.forEach((d) => {
        statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      });
      setDroneStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

      // Flight hours by drone (top 10)
      const sortedDrones = [...drones]
        .sort((a, b) => b.flyvetimer - a.flyvetimer)
        .slice(0, 10)
        .map((d) => ({
          name: `${d.modell} (${d.registrering})`,
          hours: d.flyvetimer,
        }));
      setFlightHoursByDrone(sortedDrones);
    }

    if (equipment) {
      const statusCounts: { [key: string]: number } = {};
      equipment.forEach((e) => {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      });
      setEquipmentStatus(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
    }
  };

  const fetchDocumentStatistics = async () => {
    const { data: documents } = await supabase.from("documents").select("gyldig_til");

    if (!documents) return;

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let thirtyCount = 0;
    let sixtyCount = 0;
    let ninetyCount = 0;

    documents.forEach((doc) => {
      if (!doc.gyldig_til) return;
      const expiryDate = new Date(doc.gyldig_til);
      if (expiryDate > now && expiryDate <= thirtyDays) thirtyCount++;
      else if (expiryDate > thirtyDays && expiryDate <= sixtyDays) sixtyCount++;
      else if (expiryDate > sixtyDays && expiryDate <= ninetyDays) ninetyCount++;
    });

    setExpiringDocs({ thirtyDays: thirtyCount, sixtyDays: sixtyCount, ninetyDays: ninetyCount });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Laster statistikk...</div>
        </main>
      </div>
    );
  }

  const completionRate = kpiData.totalMissions > 0
    ? ((kpiData.completedMissions / kpiData.totalMissions) * 100).toFixed(1)
    : "0";

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // KPI Sheet
      const kpiSheetData = [
        ["Nøkkeltall (KPI)", ""],
        ["Totale oppdrag", kpiData.totalMissions],
        ["Fullførte oppdrag", kpiData.completedMissions],
        ["Fullføringsgrad", `${completionRate}%`],
        ["Totale flyvetimer", kpiData.totalFlightHours],
        ["Hendelsesfrekvens", kpiData.incidentRate.toFixed(2)],
        ["Aktive ressurser", kpiData.activeResources],
      ];
      const wsKPI = XLSX.utils.aoa_to_sheet(kpiSheetData);
      XLSX.utils.book_append_sheet(wb, wsKPI, "KPI");

      // Missions by Month
      const missionMonthData = [
        ["Måned", "Antall oppdrag"],
        ...missionsByMonth.map(item => [item.month, item.count])
      ];
      const wsMissionsMonth = XLSX.utils.aoa_to_sheet(missionMonthData);
      XLSX.utils.book_append_sheet(wb, wsMissionsMonth, "Oppdrag per måned");

      // Missions by Status
      const missionStatusData = [
        ["Status", "Antall"],
        ...missionsByStatus.map(item => [item.name, item.value])
      ];
      const wsMissionsStatus = XLSX.utils.aoa_to_sheet(missionStatusData);
      XLSX.utils.book_append_sheet(wb, wsMissionsStatus, "Oppdrag per status");

      // Missions by Risk
      const missionRiskData = [
        ["Risikonivå", "Antall"],
        ...missionsByRisk.map(item => [item.name, item.value])
      ];
      const wsMissionsRisk = XLSX.utils.aoa_to_sheet(missionRiskData);
      XLSX.utils.book_append_sheet(wb, wsMissionsRisk, "Oppdrag per risiko");

      // Incidents by Month
      const incidentMonthData = [
        ["Måned", "Antall hendelser"],
        ...incidentsByMonth.map(item => [item.month, item.count])
      ];
      const wsIncidentsMonth = XLSX.utils.aoa_to_sheet(incidentMonthData);
      XLSX.utils.book_append_sheet(wb, wsIncidentsMonth, "Hendelser per måned");

      // Incidents by Category
      const incidentCategoryData = [
        ["Kategori", "Antall"],
        ...incidentsByCategory.map(item => [item.name, item.value])
      ];
      const wsIncidentsCategory = XLSX.utils.aoa_to_sheet(incidentCategoryData);
      XLSX.utils.book_append_sheet(wb, wsIncidentsCategory, "Hendelser per kategori");

      // Incidents by Severity
      const incidentSeverityData = [
        ["Alvorlighetsgrad", "Antall"],
        ...incidentsBySeverity.map(item => [item.name, item.value])
      ];
      const wsIncidentsSeverity = XLSX.utils.aoa_to_sheet(incidentSeverityData);
      XLSX.utils.book_append_sheet(wb, wsIncidentsSeverity, "Hendelser per alvorlighetsgrad");

      // Drone Status
      const droneStatusData = [
        ["Status", "Antall"],
        ...droneStatus.map(item => [item.name, item.value])
      ];
      const wsDroneStatus = XLSX.utils.aoa_to_sheet(droneStatusData);
      XLSX.utils.book_append_sheet(wb, wsDroneStatus, "Dronestatus");

      // Equipment Status
      const equipmentStatusData = [
        ["Status", "Antall"],
        ...equipmentStatus.map(item => [item.name, item.value])
      ];
      const wsEquipmentStatus = XLSX.utils.aoa_to_sheet(equipmentStatusData);
      XLSX.utils.book_append_sheet(wb, wsEquipmentStatus, "Utstyrstatus");

      // Flight Hours by Drone
      const flightHoursData = [
        ["Drone", "Flyvetimer"],
        ...flightHoursByDrone.map(item => [item.name, item.hours])
      ];
      const wsFlightHours = XLSX.utils.aoa_to_sheet(flightHoursData);
      XLSX.utils.book_append_sheet(wb, wsFlightHours, "Flyvetimer per drone");

      // Expiring Documents
      const expiringDocsData = [
        ["Tidsperiode", "Antall dokumenter"],
        ["Innen 30 dager", expiringDocs.thirtyDays],
        ["Innen 60 dager", expiringDocs.sixtyDays],
        ["Innen 90 dager", expiringDocs.ninetyDays],
      ];
      const wsExpiringDocs = XLSX.utils.aoa_to_sheet(expiringDocsData);
      XLSX.utils.book_append_sheet(wb, wsExpiringDocs, "Dokumenter som utløper");

      // Generate filename with date
      const fileName = `statistikk-rapport-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, fileName);
      
      toast.success("Excel-rapport eksportert", {
        description: "Filen har blitt lastet ned"
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Feil ved eksport", {
        description: "Kunne ikke generere Excel-rapport"
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading("Genererer PDF-rapport...");
      
      // Get company name from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { data: company } = await supabase
        .from("companies")
        .select("navn")
        .eq("id", profile?.company_id)
        .single();

      const periodLabel = timePeriod === "month" ? "Siste måned" : 
                         timePeriod === "quarter" ? "Siste kvartal" : "Siste år";

      const exportData = {
        kpiData,
        missionsByMonth,
        missionsByStatus,
        missionsByRisk,
        incidentsByMonth,
        incidentsByCategory,
        incidentsBySeverity,
        daysSinceLastSevere,
        droneStatus,
        equipmentStatus,
        expiringDocs,
        timePeriod: periodLabel,
        companyName: company?.navn || "Ukjent selskap",
      };

      const { data, error } = await supabase.functions.invoke('export-statistics-pdf', {
        body: exportData,
      });

      if (error) throw error;

      // Create a blob from the HTML content and download
      const blob = new Blob([data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistikk-rapport-${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success("PDF-rapport eksportert", {
        description: "Filen har blitt lastet ned (åpne i nettleser og skriv ut til PDF)"
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.dismiss();
      toast.error("Feil ved eksport", {
        description: "Kunne ikke generere PDF-rapport"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-4xl font-bold text-foreground">Statistikk</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Tidsperiode:</span>
            <Select value={timePeriod} onValueChange={(value: "month" | "quarter" | "year") => setTimePeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Siste måned</SelectItem>
                <SelectItem value="quarter">Siste kvartal</SelectItem>
                <SelectItem value="year">Siste år</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Eksporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Eksporter til Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Eksporter til PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totale oppdrag</p>
                <p className="text-3xl font-bold text-foreground">{kpiData.totalMissions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completionRate}% fullført
                </p>
              </div>
              <Activity className="w-10 h-10 text-primary opacity-70" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totale flyvetimer</p>
                <p className="text-3xl font-bold text-foreground">{kpiData.totalFlightHours}</p>
                <p className="text-xs text-muted-foreground mt-1">timer</p>
              </div>
              <Clock className="w-10 h-10 text-primary opacity-70" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hendelsesfrekvens</p>
                <p className="text-3xl font-bold text-foreground">
                  {kpiData.incidentRate.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per 100 flyvetimer</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-destructive opacity-70" />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive ressurser</p>
                <p className="text-3xl font-bold text-foreground">{kpiData.activeResources}</p>
                <p className="text-xs text-muted-foreground mt-1">droner og utstyr</p>
              </div>
              <Package className="w-10 h-10 text-primary opacity-70" />
            </div>
          </GlassCard>
        </div>

        {/* Mission Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Oppdrag per måned
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={missionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Oppdrag"
                />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Oppdrag per status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={missionsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {missionsByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Oppdrag per risikonivå
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={missionsByRisk}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill={COLORS.primary} name="Antall" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">HMS - Sikkerhetsstatus</h2>
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Dager siden siste alvorlige hendelse
                </p>
                <p className="text-6xl font-bold text-foreground">{daysSinceLastSevere}</p>
                <p className="text-sm text-muted-foreground mt-2">dager</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Incident Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Hendelser per måned (siste 6 mnd)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill={COLORS.destructive} name="Hendelser" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Hendelser per kategori
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incidentsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill={COLORS.destructive}
                  dataKey="value"
                >
                  {incidentsByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Hendelser per alvorlighetsgrad
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentsBySeverity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill={COLORS.warning} name="Antall" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Resource & Document Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Drone statusfordeling
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={droneStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {droneStatus.map((entry, index) => {
                    const colorMap: { [key: string]: string } = {
                      Grønn: COLORS.success,
                      Gul: COLORS.warning,
                      Rød: COLORS.destructive,
                    };
                    return <Cell key={`cell-${index}`} fill={colorMap[entry.name] || COLORS.muted} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Utstyr statusfordeling
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={equipmentStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill={COLORS.primary}
                  dataKey="value"
                >
                  {equipmentStatus.map((entry, index) => {
                    const colorMap: { [key: string]: string } = {
                      Grønn: COLORS.success,
                      Gul: COLORS.warning,
                      Rød: COLORS.destructive,
                    };
                    return <Cell key={`cell-${index}`} fill={colorMap[entry.name] || COLORS.muted} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Flyvetimer per drone (topp 10)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={flightHoursByDrone} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="hours" fill={COLORS.primary} name="Timer" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Dokumenter som utløper
            </h2>
            <div className="space-y-6 pt-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Innen 30 dager</span>
                  <span className="text-2xl font-bold text-destructive">
                    {expiringDocs.thirtyDays}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-destructive h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (expiringDocs.thirtyDays /
                          Math.max(
                            expiringDocs.thirtyDays,
                            expiringDocs.sixtyDays,
                            expiringDocs.ninetyDays,
                            1
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Innen 60 dager</span>
                  <span className="text-2xl font-bold text-warning">
                    {expiringDocs.sixtyDays}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-warning h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (expiringDocs.sixtyDays /
                          Math.max(
                            expiringDocs.thirtyDays,
                            expiringDocs.sixtyDays,
                            expiringDocs.ninetyDays,
                            1
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Innen 90 dager</span>
                  <span className="text-2xl font-bold text-primary">
                    {expiringDocs.ninetyDays}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        (expiringDocs.ninetyDays /
                          Math.max(
                            expiringDocs.thirtyDays,
                            expiringDocs.sixtyDays,
                            expiringDocs.ninetyDays,
                            1
                          )) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
};

export default Status;
