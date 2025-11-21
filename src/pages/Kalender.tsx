import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, Plus, Shield, LogOut, Settings, Menu } from "lucide-react";
import droneBackground from "@/assets/drone-background.png";
import { ProfileDialog } from "@/components/ProfileDialog";
import { PendingApprovalsBadge } from "@/components/PendingApprovalsBadge";
import { format, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mockDocuments, mockMissions, mockDrones, mockEquipment } from "@/data/mockData";
import type { Tables } from "@/integrations/supabase/types";
import { AddMissionDialog } from "@/components/dashboard/AddMissionDialog";
import { AddIncidentDialog } from "@/components/dashboard/AddIncidentDialog";
import DocumentCardModal from "@/components/documents/DocumentCardModal";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarEvent {
  type: string;
  title: string;
  date: Date;
  color: string;
  description?: string;
  id?: string;
  isCustom?: boolean;
}

type CalendarEventDB = Tables<"calendar_events">;

// Generate calendar events from mock data
const getMockCalendarEvents = (): CalendarEvent[] => [
  ...mockDocuments
    .filter((doc) => doc.gyldig_til)
    .map((doc) => ({
      type: "Dokument",
      title: `${doc.tittel} utgår`,
      date: doc.gyldig_til!,
      color: "text-blue-500",
    })),
  ...mockMissions.map((mission) => ({
    type: "Oppdrag",
    title: mission.tittel,
    date: mission.start,
    color: "text-primary",
  })),
  ...mockDrones
    .filter((drone) => drone.neste_inspeksjon)
    .map((drone) => ({
      type: "Vedlikehold",
      title: `${drone.modell} - inspeksjon`,
      date: drone.neste_inspeksjon!,
      color: "text-orange-500",
    })),
  ...mockEquipment
    .filter((eq) => eq.neste_vedlikehold)
    .map((eq) => ({
      type: "Vedlikehold",
      title: `${eq.navn} - vedlikehold`,
      date: eq.neste_vedlikehold!,
      color: "text-orange-500",
    })),
];

const getColorForType = (type: string): string => {
  switch (type) {
    case "Oppdrag": return "text-primary";
    case "Vedlikehold": return "text-orange-500";
    case "Dokument": return "text-blue-500";
    case "Møte": return "text-purple-500";
    default: return "text-gray-500";
  }
};

export default function Kalender() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customEvents, setCustomEvents] = useState<CalendarEventDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Dialog states for different entry types
  const [addMissionDialogOpen, setAddMissionDialogOpen] = useState(false);
  const [addIncidentDialogOpen, setAddIncidentDialogOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentModalState, setDocumentModalState] = useState<{
    document: any | null;
    isCreating: boolean;
  }>({
    document: null,
    isCreating: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        setIsAdmin(data || false);
      }
    };
    checkAdminStatus();
  }, []);

  useEffect(() => {
    fetchCustomEvents();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomEvents((current) => [...current, payload.new as CalendarEventDB]);
          } else if (payload.eventType === 'UPDATE') {
            setCustomEvents((current) =>
              current.map((event) =>
                event.id === (payload.new as CalendarEventDB).id ? (payload.new as CalendarEventDB) : event
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCustomEvents((current) =>
              current.filter((event) => event.id !== (payload.old as CalendarEventDB).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCustomEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;

      setCustomEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      toast.error('Kunne ikke laste kalenderoppføringer');
    } finally {
      setLoading(false);
    }
  };

  // Combine mock and custom events
  const allEvents: CalendarEvent[] = [
    ...getMockCalendarEvents(),
    ...customEvents.map((event) => {
      const eventDate = new Date(event.event_date);
      if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }
      
      return {
        id: event.id,
        type: event.type,
        title: event.title,
        date: eventDate,
        description: event.description || undefined,
        color: getColorForType(event.type),
        isCustom: true,
      };
    }),
  ];

  const getEventsForDate = (checkDate: Date) => {
    return allEvents.filter((event) => isSameDay(event.date, checkDate));
  };

  const hasEvents = (checkDate: Date) => {
    return getEventsForDate(checkDate).length > 0;
  };

  const handleDateClick = (clickedDate: Date | undefined) => {
    if (clickedDate) {
      setSelectedDate(clickedDate);
      setDialogOpen(true);
    }
  };

  const handleAddEntry = (type: 'oppdrag' | 'hendelse' | 'dokument') => {
    switch (type) {
      case 'oppdrag':
        setAddMissionDialogOpen(true);
        break;
      case 'hendelse':
        setAddIncidentDialogOpen(true);
        break;
      case 'dokument':
        setDocumentModalState({
          document: null,
          isCreating: true,
        });
        setDocumentModalOpen(true);
        break;
    }
  };

  const handleDocumentModalClose = () => {
    setDocumentModalOpen(false);
    setDocumentModalState({
      document: null,
      isCreating: false,
    });
  };

  const handleDocumentSaveSuccess = () => {
    toast.success("Dokument lagret!");
    fetchCustomEvents();
    handleDocumentModalClose();
  };

  const handleDocumentDeleteSuccess = () => {
    toast.success("Dokument slettet!");
    fetchCustomEvents();
    handleDocumentModalClose();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden">
      {/* Background with gradient overlay */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${droneBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        {/* Header */}
        <header className="bg-card/20 backdrop-blur-md border-b border-glass sticky top-0 z-50 w-full">
          <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 sm:gap-2 lg:gap-3 hover:bg-transparent p-0 flex-shrink-0"
                onClick={() => navigate("/")}
              >
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" />
                <div className="text-left">
                  <h1 className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold whitespace-nowrap">SMS</h1>
                  <p className="text-xs lg:text-sm text-primary hidden lg:block">Drone Operations</p>
                </div>
              </Button>
              
              {/* Mobile Navigation - Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-md border-glass z-50">
                  <DropdownMenuItem onClick={() => navigate("/kart")}>Kart</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dokumenter")}>Dokumenter</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/kalender")}>Kalender</DropdownMenuItem>
                  <DropdownMenuItem>Hendelser</DropdownMenuItem>
                  <DropdownMenuItem>Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/ressurser")}>Ressurser</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 flex-shrink">
                <Button variant="ghost" size="sm" onClick={() => navigate("/kart")}>Kart</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dokumenter")}>Dokumenter</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/kalender")}>Kalender</Button>
                <Button variant="ghost" size="sm">Hendelser</Button>
                <Button variant="ghost" size="sm">Status</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/ressurser")}>Ressurser</Button>
              </nav>
              
              <nav className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
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
                  title="Logg ut"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-3 sm:px-4 py-3 sm:py-5">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar */}
            <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Månedsoversikt</h2>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Legg til oppføring
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAddEntry('oppdrag')}>
                      Oppdrag
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddEntry('hendelse')}>
                      Hendelse
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddEntry('dokument')}>
                      Dokument
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateClick}
                locale={nb}
                className={cn("rounded-md border-0 pointer-events-auto w-full")}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-lg font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-sm",
                  row: "flex w-full mt-2",
                  cell: cn(
                    "relative p-0 text-center focus-within:relative focus-within:z-20 w-full min-h-[120px]",
                    "[&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50"
                  ),
                  day: cn(
                    "h-full w-full p-2 font-normal hover:bg-accent hover:text-accent-foreground rounded-md",
                    "flex flex-col items-start justify-start gap-1"
                  ),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                }}
                components={{
                  Day: ({ date: dayDate, ...props }) => {
                    const dayEvents = getEventsForDate(dayDate);
                    const displayEvents = dayEvents.slice(0, 2);
                    const remainingCount = dayEvents.length - 2;

                    return (
                      <button
                        {...props}
                        className={cn(
                          "h-full w-full p-2 font-normal hover:bg-accent hover:text-accent-foreground rounded-md",
                          "flex flex-col items-start justify-start gap-1 text-left"
                        )}
                      >
                        <span className="text-sm font-medium">{format(dayDate, "d")}</span>
                        {displayEvents.map((event, idx) => (
                          <div
                            key={event.id || idx}
                            className="text-[10px] truncate w-full px-1 py-0.5 bg-primary/10 rounded text-primary"
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{remainingCount} flere
                          </div>
                        )}
                      </button>
                    );
                  },
                }}
              />
            </div>

            {/* Event List for Selected Date */}
            {selectedDate && (
              <div className="lg:w-80 bg-card/50 backdrop-blur-sm rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {format(selectedDate, "dd. MMMM yyyy", { locale: nb })}
                </h3>
                <div className="space-y-3">
                  {selectedEvents.length > 0 ? (
                    selectedEvents.map((event, index) => (
                      <div
                        key={event.id || index}
                        className="p-3 bg-card/30 rounded-lg border border-border"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                          <div className={cn("text-xs font-medium", event.color)}>
                            {format(event.date, "HH:mm")}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Ingen hendelser denne dagen
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "dd. MMMM yyyy", { locale: nb })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event, index) => (
                <div
                  key={event.id || index}
                  className="p-3 bg-card/30 rounded-lg border border-border"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <div className={cn("text-xs font-medium", event.color)}>
                      {format(event.date, "HH:mm")}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen hendelser denne dagen
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reusable Dialogs */}
      <AddMissionDialog
        open={addMissionDialogOpen}
        onOpenChange={setAddMissionDialogOpen}
        onMissionAdded={() => {
          toast.success("Oppdrag opprettet!");
          fetchCustomEvents();
        }}
      />

      <AddIncidentDialog
        open={addIncidentDialogOpen}
        onOpenChange={setAddIncidentDialogOpen}
        defaultDate={selectedDate || undefined}
      />

      <DocumentCardModal
        document={documentModalState.document}
        isOpen={documentModalOpen}
        onClose={handleDocumentModalClose}
        onSaveSuccess={handleDocumentSaveSuccess}
        onDeleteSuccess={handleDocumentDeleteSuccess}
        isAdmin={isAdmin}
        isCreating={documentModalState.isCreating}
      />
    </div>
  );
}
