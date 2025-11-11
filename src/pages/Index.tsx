import droneBackground from "@/assets/drone-background.png";
import { DocumentSection } from "@/components/dashboard/DocumentSection";
import { StatusPanel } from "@/components/dashboard/StatusPanel";
import { CalendarSection } from "@/components/dashboard/CalendarSection";
import { IncidentsSection } from "@/components/dashboard/IncidentsSection";
import { MissionsSection } from "@/components/dashboard/MissionsSection";
import { KPIChart } from "@/components/dashboard/KPIChart";
import { NewsSection } from "@/components/dashboard/NewsSection";
import { Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      {/* Background with gradient overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${droneBackground})`,
          backgroundSize: "100% auto",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card/20 backdrop-blur-md border-b border-glass sticky top-0 z-50">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Sikkerhetsstyringssystem</h1>
                  <p className="text-xs text-muted-foreground">Drone Operations Management</p>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-4 text-xs font-medium">
                <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                  Dashboard
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Dokumenter
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Kalender
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Hendelser
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Oppdrag
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  Ressurser
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-3 max-w-[1800px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Left Column */}
            <div className="space-y-3">
              <DocumentSection />
              <CalendarSection />
            </div>

            {/* Middle Column */}
            <div className="space-y-3">
              <StatusPanel />
              <MissionsSection />
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <IncidentsSection />
              <KPIChart />
              <NewsSection />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
