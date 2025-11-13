import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface AddNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddNewsDialog = ({ open, onOpenChange }: AddNewsDialogProps) => {
  const [tittel, setTittel] = useState("");
  const [innhold, setInnhold] = useState("");
  const [pinOnTop, setPinOnTop] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tittel.trim() || !innhold.trim()) {
      toast.error("Tittel og innhold er påkrevd");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Du må være innlogget");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { error } = await (supabase as any)
        .from('news')
        .insert({
          tittel: tittel.trim(),
          innhold: innhold.trim(),
          pin_on_top: pinOnTop,
          user_id: user.id,
          forfatter: profile?.full_name || 'Ukjent'
        });

      if (error) throw error;

      toast.success("Nyhet lagt til");
      setTittel("");
      setInnhold("");
      setPinOnTop(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding news:", error);
      toast.error("Kunne ikke legge til nyhet");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Legg til nyhet</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tittel">Tittel</Label>
            <Input
              id="tittel"
              value={tittel}
              onChange={(e) => setTittel(e.target.value)}
              placeholder="Skriv tittel..."
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="innhold">Beskrivelse</Label>
            <Textarea
              id="innhold"
              value={innhold}
              onChange={(e) => setInnhold(e.target.value)}
              placeholder="Skriv beskrivelse..."
              rows={4}
              disabled={submitting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pin"
              checked={pinOnTop}
              onCheckedChange={(checked) => setPinOnTop(checked as boolean)}
              disabled={submitting}
            />
            <Label htmlFor="pin" className="cursor-pointer">
              Fest øverst (prioritert)
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Legger til..." : "Legg til"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
