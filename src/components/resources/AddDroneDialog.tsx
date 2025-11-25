import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddDroneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDroneAdded: () => void;
  userId: string;
}

export const AddDroneDialog = ({ open, onOpenChange, onDroneAdded, userId }: AddDroneDialogProps) => {
  const handleAddDrone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await (supabase as any).from("drones").insert([{
      user_id: userId,
      modell: formData.get("modell") as string,
      registrering: formData.get("registrering") as string,
      status: (formData.get("status") as string) || "Grønn",
      flyvetimer: parseInt(formData.get("flyvetimer") as string) || 0,
      merknader: (formData.get("merknader") as string) || null,
      sist_inspeksjon: (formData.get("sist_inspeksjon") as string) || null,
      neste_inspeksjon: (formData.get("neste_inspeksjon") as string) || null,
    }]);

    if (error) {
      console.error("Error adding drone:", error);
      toast.error("Kunne ikke legge til drone");
    } else {
      toast.success("Drone lagt til");
      onOpenChange(false);
      onDroneAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Legg til
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til ny drone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddDrone} className="space-y-4">
          <div>
            <Label htmlFor="modell">Modell</Label>
            <Input id="modell" name="modell" required />
          </div>
          <div>
            <Label htmlFor="registrering">Registrering</Label>
            <Input id="registrering" name="registrering" required />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue="Grønn">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Grønn">Grønn</SelectItem>
                <SelectItem value="Gul">Gul</SelectItem>
                <SelectItem value="Rød">Rød</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="flyvetimer">Flyvetimer</Label>
            <Input id="flyvetimer" name="flyvetimer" type="number" defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="sist_inspeksjon">Sist inspeksjon</Label>
            <Input id="sist_inspeksjon" name="sist_inspeksjon" type="date" />
          </div>
          <div>
            <Label htmlFor="neste_inspeksjon">Neste inspeksjon</Label>
            <Input id="neste_inspeksjon" name="neste_inspeksjon" type="date" />
          </div>
          <div>
            <Label htmlFor="merknader">Merknader</Label>
            <Textarea id="merknader" name="merknader" />
          </div>
          <Button type="submit" className="w-full">Legg til drone</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
