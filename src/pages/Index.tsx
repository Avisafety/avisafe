import droneBackground from "@/assets/drone-background.png";
import { DocumentSection } from "@/components/dashboard/DocumentSection";
import { StatusPanel } from "@/components/dashboard/StatusPanel";
import { CalendarSection } from "@/components/dashboard/CalendarSection";
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
  { id: "documents", component: "documents", gridClass: "lg:col-span-2" },
  { id: "news", component: "news", gridClass: "lg:col-span-3" },
  { id: "status", component: "status", gridClass: "lg:col-span-4" },
  { id: "missions", component: "missions", gridClass: "lg:col-span-3 lg:row-span-2" },
  { id: "calendar", component: "calendar", gridClass: "lg:col-span-2" },
  { id: "incidents", component: "incidents", gridClass: "lg:col-span-3" },
  { id: "kpi", component: "kpi", gridClass: "lg:col-span-4" },
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
        return <CalendarSection />;
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetLayout}
                  className="ml-2"
                  title="Tilbakestill layout"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-3 max-w-[1600px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={layout.map((item) => item.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 auto-rows-min">
                {layout.map((item) => (
                  <DraggableSection key={item.id} id={item.id} className={item.gridClass}>
                    {renderSection(item.component)}
                  </DraggableSection>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </main>
      </div>
    </div>
  );
};

export default Index;
