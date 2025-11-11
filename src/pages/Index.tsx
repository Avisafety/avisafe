import droneBackground from "@/assets/drone-background.png";
import { DocumentSection } from "@/components/dashboard/DocumentSection";
import { StatusPanel } from "@/components/dashboard/StatusPanel";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { IncidentsSection } from "@/components/dashboard/IncidentsSection";
import { MissionsSection } from "@/components/dashboard/MissionsSection";
import { KPIChart } from "@/components/dashboard/KPIChart";
import { NewsSection } from "@/components/dashboard/NewsSection";
import { DraggableSection } from "@/components/dashboard/DraggableSection";
import { Shield, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "dashboard-layout";

const defaultLayout = [
  { id: "documents", component: "documents" },
  { id: "news", component: "news" },
  { id: "calendar", component: "calendar" },
  { id: "status", component: "status" },
  { id: "missions", component: "missions" },
  { id: "incidents", component: "incidents" },
  { id: "kpi", component: "kpi" },
];

const Index = () => {
  const [layout, setLayout] = useState(defaultLayout);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const savedLayout = localStorage.getItem(STORAGE_KEY);
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (e) {
        console.error("Failed to parse saved layout:", e);
      }
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newLayout = [...items];
        const [movedItem] = newLayout.splice(oldIndex, 1);
        newLayout.splice(newIndex, 0, movedItem);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
        toast.success("Layout oppdatert");
        
        return newLayout;
      });
    }
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Layout tilbakestilt");
  };

  const renderSection = (component: string) => {
    switch (component) {
      case "documents":
        return <DocumentSection />;
      case "news":
        return <NewsSection />;
      case "status":
        return <StatusPanel />;
      case "missions":
        return <MissionsSection />;
      case "calendar":
        return <CalendarWidget />;
      case "incidents":
        return <IncidentsSection />;
      case "kpi":
        return <KPIChart />;
      default:
        return null;
    }
  };

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
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Sikkerhetsstyringssystem</h1>
                  <p className="text-sm text-muted-foreground">Drone Operations Management</p>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetLayout}
                  className="ml-2"
                  title="Tilbakestill layout"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-5 max-w-[1800px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={layout.map((item) => item.id)} strategy={rectSortingStrategy}>
              <div className="space-y-4">
                {/* Top Row - News */}
                <div className="w-full">
                  {layout
                    .filter((item) => item.component === "news")
                    .map((item) => (
                      <DraggableSection key={item.id} id={item.id}>
                        {renderSection(item.component)}
                      </DraggableSection>
                    ))}
                </div>

                {/* Middle Row - Sidebars with center space */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column */}
                  <div className="lg:col-span-3 space-y-4">
                    {layout
                      .filter((item) => ["documents", "calendar"].includes(item.component))
                      .map((item) => (
                        <DraggableSection key={item.id} id={item.id}>
                          {renderSection(item.component)}
                        </DraggableSection>
                      ))}
                  </div>

                  {/* Center - Empty space for drone background */}
                  <div className="lg:col-span-6 min-h-[400px]" />

                  {/* Right Column */}
                  <div className="lg:col-span-3 space-y-4">
                    {layout
                      .filter((item) => ["status", "incidents", "kpi"].includes(item.component))
                      .map((item) => (
                        <DraggableSection key={item.id} id={item.id}>
                          {renderSection(item.component)}
                        </DraggableSection>
                      ))}
                  </div>
                </div>

                {/* Bottom Row - Missions */}
                <div className="w-full">
                  {layout
                    .filter((item) => item.component === "missions")
                    .map((item) => (
                      <DraggableSection key={item.id} id={item.id}>
                        {renderSection(item.component)}
                      </DraggableSection>
                    ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </main>
      </div>
    </div>
  );
};

export default Index;
