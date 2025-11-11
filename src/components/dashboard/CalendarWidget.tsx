import { GlassCard } from "@/components/GlassCard";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { mockDocuments, mockMissions, mockDrones, mockEquipment } from "@/data/mockData";
import { format, isSameDay } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CalendarEvent {
  type: string;
  title: string;
  date: Date;
  color: string;
}

// Generate calendar events from mock data
const calendarEvents: CalendarEvent[] = [
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

export const CalendarWidget = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "Oppdrag",
    description: "",
    time: "09:00",
  });

  const getEventsForDate = (checkDate: Date) => {
    return calendarEvents.filter((event) => isSameDay(event.date, checkDate));
  };

  const hasEvents = (checkDate: Date) => {
    return getEventsForDate(checkDate).length > 0;
  };

  const handleDateClick = (clickedDate: Date | undefined) => {
    if (clickedDate) {
      setSelectedDate(clickedDate);
      setDialogOpen(true);
      setShowAddForm(false);
      setNewEvent({ title: "", type: "Oppdrag", description: "", time: "09:00" });
      setDate(undefined); // Clear selection so it doesn't stay blue
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error("Tittel er påkrevd");
      return;
    }
    
    // Her ville vi normalt lagret til database
    toast.success("Hendelse opprettet (simulert)");
    setShowAddForm(false);
    setDialogOpen(false);
    setNewEvent({ title: "", type: "Oppdrag", description: "", time: "09:00" });
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <>
      <GlassCard className="h-[400px] flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Kalender</h2>
        </div>

        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateClick}
          locale={nb}
          className={cn("rounded-md border-0 pointer-events-auto w-full")}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4 w-full",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex w-full",
            head_cell:
              "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md w-full",
              "h-9"
            ),
            day: cn(
              "h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md relative [&.has-events]:font-bold [&.has-events]:after:absolute [&.has-events]:after:bottom-1 [&.has-events]:after:left-1/2 [&.has-events]:after:-translate-x-1/2 [&.has-events]:after:w-1 [&.has-events]:after:h-1 [&.has-events]:after:bg-primary [&.has-events]:after:rounded-full"
            ),
            day_range_start: "day-range-start",
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
          modifiers={{
            hasEvents: (day) => hasEvents(day),
          }}
          modifiersClassNames={{
            hasEvents: "has-events",
          }}
        />
      </GlassCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "dd. MMMM yyyy", { locale: nb })}
            </DialogTitle>
            <DialogDescription>
              Hendelser og aktiviteter for denne dagen
            </DialogDescription>
          </DialogHeader>

          {!showAddForm ? (
            <>
              <div className="space-y-3">
                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event, index) => (
                    <div
                      key={index}
                      className="p-3 bg-card/30 rounded-lg border border-border"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
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

              <Button onClick={() => setShowAddForm(true)} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Legg til hendelse
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  placeholder="F.eks. Oppdrag i Oslo"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oppdrag">Oppdrag</SelectItem>
                    <SelectItem value="Vedlikehold">Vedlikehold</SelectItem>
                    <SelectItem value="Dokument">Dokument utgår</SelectItem>
                    <SelectItem value="Møte">Møte</SelectItem>
                    <SelectItem value="Annet">Annet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Tidspunkt</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  placeholder="Legg til detaljer..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Avbryt
                </Button>
                <Button onClick={handleAddEvent} className="flex-1">
                  Lagre
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
