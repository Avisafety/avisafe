import droneBackground from "@/assets/drone-background.png";
import { DocumentSection } from "@/components/dashboard/DocumentSection";
import { StatusPanel } from "@/components/dashboard/StatusPanel";
import { CalendarWidget } from "@/components/dashboard/CalendarWidget";
import { IncidentsSection } from "@/components/dashboard/IncidentsSection";
import { MissionsSection } from "@/components/dashboard/MissionsSection";
import { KPIChart } from "@/components/dashboard/KPIChart";
import { NewsSection } from "@/components/dashboard/NewsSection";
import { DraggableSection } from "@/components/dashboard/DraggableSection";
import { Shield, LogOut, Settings } from "lucide-react";
import { ProfileDialog } from "@/components/ProfileDialog";
import { PendingApprovalsBadge } from "@/components/PendingApprovalsBadge";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [layout, setLayout] = useState(defaultLayout);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkUserApproval();
    }
  }, [user]);

  const checkUserApproval = async () => {
    setCheckingApproval(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", user?.id)
        .maybeSingle();

      if (profileData) {
        setIsApproved((profileData as any).approved);
        
        if (!(profileData as any).approved) {
          // User is not approved, sign them out
          await signOut();
        }
      }
    } catch (error) {
      console.error("Error checking approval:", error);
    } finally {
      setCheckingApproval(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

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


  const handleSignOut = async () => {
    await signOut();
    toast.success("Logget ut");
    navigate("/auth");
  };

  if (loading || checkingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-lg">Laster...</p>
        </div>
      </div>
    );
  }

  if (!user || !isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Avventer godkjenning</h2>
          <p className="text-muted-foreground mb-6">
            Din konto venter på godkjenning fra administrator. Du vil motta tilgang så snart kontoen er godkjent.
          </p>
          <Button onClick={() => navigate("/auth")}>
            Tilbake til innlogging
          </Button>
        </div>
      </div>
    );
  }

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
          backgroundPosition: "60% 55%",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card/20 backdrop-blur-md border-b border-glass sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 max-w-[1800px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-10 h-10 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Sikkerhetsstyringssystem</h1>
                  <p className="text-base text-primary">Drone Operations Management</p>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-4 text-base font-medium">
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
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="gap-2 relative"
                    title="Administrator"
                  >
                    <Settings className="w-4 h-4" />
                    <PendingApprovalsBadge isAdmin={isAdmin} />
                  </Button>
                )}
                <ProfileDialog />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="ml-2"
                  title="Logg ut"
                >
                  <LogOut className="w-4 h-4" />
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
                {/* Top Row - News and Status */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-9">
                    {layout
                      .filter((item) => item.component === "news")
                      .map((item) => (
                        <DraggableSection key={item.id} id={item.id}>
                          {renderSection(item.component)}
                        </DraggableSection>
                      ))}
                  </div>
                  <div className="lg:col-span-3">
                    {layout
                      .filter((item) => item.component === "status")
                      .map((item) => (
                        <DraggableSection key={item.id} id={item.id}>
                          {renderSection(item.component)}
                        </DraggableSection>
                      ))}
                  </div>
                </div>

                {/* Main Row - Sidebars with center content */}
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

                  {/* Center Column - Drone space and missions */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Empty space for drone background */}
                    <div className="min-h-[400px]" />
                    
                    {/* Missions below drone */}
                    {layout
                      .filter((item) => item.component === "missions")
                      .map((item) => (
                        <DraggableSection key={item.id} id={item.id}>
                          {renderSection(item.component)}
                        </DraggableSection>
                      ))}
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-3 flex flex-col gap-4" style={{ height: '816px' }}>
                    {layout
                      .filter((item) => item.component === "incidents")
                      .map((item) => (
                        <DraggableSection key={item.id} id={item.id} className="flex-1">
                          {renderSection(item.component)}
                        </DraggableSection>
                      ))}
                    {layout
                      .filter((item) => item.component === "kpi")
                      .map((item) => (
                        <DraggableSection key={item.id} id={item.id}>
                          {renderSection(item.component)}
                        </DraggableSection>
                      ))}
                  </div>
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
