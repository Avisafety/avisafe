import { GlassCard } from "@/components/GlassCard";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

  const getEventsForDate = (checkDate: Date) => {
    return calendarEvents.filter((event) => isSameDay(event.date, checkDate));
  };

  const hasEvents = (checkDate: Date) => {
    return getEventsForDate(checkDate).length > 0;
  };

  const handleDateClick = (clickedDate: Date | undefined) => {
    if (clickedDate && hasEvents(clickedDate)) {
      setSelectedDate(clickedDate);
      setDialogOpen(true);
    }
    setDate(clickedDate);
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Hendelser {selectedDate && format(selectedDate, "dd. MMMM yyyy", { locale: nb })}
            </DialogTitle>
            <DialogDescription>
              Detaljer om planlagte aktiviteter for denne dagen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedEvents.map((event, index) => (
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
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
