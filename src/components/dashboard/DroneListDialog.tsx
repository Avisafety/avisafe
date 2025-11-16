import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drone } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface DroneListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drones: Drone[];
}

export const DroneListDialog = ({ open, onOpenChange, drones }: DroneListDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Droner ({drones.length})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {drones.map((drone) => (
            <div key={drone.id} className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{drone.modell}</h3>
                  <p className="text-sm text-muted-foreground">{drone.registreringsnummer}</p>
                </div>
                <StatusBadge status={drone.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Flytimer:</span>
                  <span className="ml-2 font-medium">{drone.flytimer}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tilgjengelig:</span>
                  <span className="ml-2 font-medium">{drone.tilgjengelig ? "Ja" : "Nei"}</span>
                </div>
                {drone.neste_inspeksjon && (
                  <div>
                    <span className="text-muted-foreground">Neste inspeksjon:</span>
                    <span className="ml-2 font-medium">
                      {format(drone.neste_inspeksjon, "dd.MM.yyyy", { locale: nb })}
                    </span>
                  </div>
                )}
                {drone.sist_inspeksjon && (
                  <div>
                    <span className="text-muted-foreground">Sist inspeksjon:</span>
                    <span className="ml-2 font-medium">
                      {format(drone.sist_inspeksjon, "dd.MM.yyyy", { locale: nb })}
                    </span>
                  </div>
                )}
              </div>
              
              {drone.merknader && (
                <div className="text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Merknader:</span>
                  <p className="mt-1">{drone.merknader}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};