import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentAdded: () => void;
  userId: string;
}

export const AddEquipmentDialog = ({ open, onOpenChange, onEquipmentAdded, userId }: AddEquipmentDialogProps) => {
  const handleAddEquipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await (supabase as any).from("equipment").insert([{
      user_id: userId,
      navn: formData.get("navn") as string,
      type: formData.get("type") as string,
      serienummer: formData.get("serienummer") as string,
      status: (formData.get("status") as string) || "Grønn",
      merknader: (formData.get("merknader") as string) || null,
      sist_vedlikeholdt: (formData.get("sist_vedlikeholdt") as string) || null,
      neste_vedlikehold: (formData.get("neste_vedlikehold") as string) || null,
    }]);

    if (error) {
      console.error("Error adding equipment:", error);
      toast.error("Kunne ikke legge til utstyr");
    } else {
      toast.success("Utstyr lagt til");
      onOpenChange(false);
      onEquipmentAdded();
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
          <DialogTitle>Legg til nytt utstyr</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddEquipment} className="space-y-4">
          <div>
            <Label htmlFor="navn">Navn</Label>
            <Input id="navn" name="navn" required />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Input id="type" name="type" required />
          </div>
          <div>
            <Label htmlFor="serienummer">Serienummer</Label>
            <Input id="serienummer" name="serienummer" required />
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
            <Label htmlFor="sist_vedlikeholdt">Sist vedlikeholdt</Label>
            <Input id="sist_vedlikeholdt" name="sist_vedlikeholdt" type="date" />
          </div>
          <div>
            <Label htmlFor="neste_vedlikehold">Neste vedlikehold</Label>
            <Input id="neste_vedlikehold" name="neste_vedlikehold" type="date" />
          </div>
          <div>
            <Label htmlFor="merknader">Merknader</Label>
            <Textarea id="merknader" name="merknader" />
          </div>
          <Button type="submit" className="w-full">Legg til utstyr</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
