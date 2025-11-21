import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

export const AddIncidentDialog = ({ open, onOpenChange, defaultDate }: AddIncidentDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [missions, setMissions] = useState<Array<{ id: string; tittel: string; status: string; tidspunkt: string }>>([]);
  const [formData, setFormData] = useState({
    tittel: "",
    beskrivelse: "",
    hendelsestidspunkt: "",
    alvorlighetsgrad: "Middels",
    status: "Åpen",
    kategori: "",
    lokasjon: "",
    mission_id: "",
  });

  useEffect(() => {
    if (open) {
      fetchMissions();
      if (defaultDate) {
        // Format date to datetime-local format
        const year = defaultDate.getFullYear();
        const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
        const day = String(defaultDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}T09:00`;
        setFormData(prev => ({ ...prev, hendelsestidspunkt: dateStr }));
      }
    } else {
      // Reset form when dialog closes
      setFormData({
        tittel: "",
        beskrivelse: "",
        hendelsestidspunkt: "",
        alvorlighetsgrad: "Middels",
        status: "Åpen",
        kategori: "",
        lokasjon: "",
        mission_id: "",
      });
    }
  }, [open, defaultDate]);

  const fetchMissions = async () => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('id, tittel, status, tidspunkt')
        .in('status', ['Planlagt', 'Tildelt', 'Pågår'])
        .order('tidspunkt', { ascending: true });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Error fetching missions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tittel || !formData.hendelsestidspunkt) {
      toast.error("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Du må være logget inn for å rapportere hendelser");
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('incidents')
        .insert({
          user_id: user.id,
          tittel: formData.tittel,
          beskrivelse: formData.beskrivelse,
          hendelsestidspunkt: new Date(formData.hendelsestidspunkt).toISOString(),
          alvorlighetsgrad: formData.alvorlighetsgrad,
          status: formData.status,
          kategori: formData.kategori || null,
          lokasjon: formData.lokasjon || null,
          rapportert_av: user.email || 'Ukjent',
          mission_id: formData.mission_id || null,
        });

      if (error) throw error;

      toast.success("Hendelse rapportert!");
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`Feil ved rapportering: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Rapporter hendelse</DialogTitle>
          <DialogDescription>
            Fyll ut informasjon om hendelsen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mission">Knytt til oppdrag (valgfritt)</Label>
            <Select
              value={formData.mission_id}
              onValueChange={(value) => setFormData({ ...formData, mission_id: value })}
            >
              <SelectTrigger id="mission">
                <SelectValue placeholder="Velg oppdrag..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ingen oppdrag</SelectItem>
                {missions.map((mission) => (
                  <SelectItem key={mission.id} value={mission.id}>
                    {mission.tittel} ({mission.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tittel">Tittel *</Label>
            <Input
              id="tittel"
              value={formData.tittel}
              onChange={(e) => setFormData({ ...formData, tittel: e.target.value })}
              placeholder="Kort beskrivelse av hendelsen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beskrivelse">Beskrivelse</Label>
            <Textarea
              id="beskrivelse"
              value={formData.beskrivelse}
              onChange={(e) => setFormData({ ...formData, beskrivelse: e.target.value })}
              placeholder="Detaljert beskrivelse av hendelsen..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hendelsestidspunkt">Hendelsestidspunkt *</Label>
            <Input
              id="hendelsestidspunkt"
              type="datetime-local"
              value={formData.hendelsestidspunkt}
              onChange={(e) => setFormData({ ...formData, hendelsestidspunkt: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alvorlighetsgrad">Alvorlighetsgrad</Label>
            <Select
              value={formData.alvorlighetsgrad}
              onValueChange={(value) => setFormData({ ...formData, alvorlighetsgrad: value })}
            >
              <SelectTrigger id="alvorlighetsgrad">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lav">Lav</SelectItem>
                <SelectItem value="Middels">Middels</SelectItem>
                <SelectItem value="Høy">Høy</SelectItem>
                <SelectItem value="Kritisk">Kritisk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Åpen">Åpen</SelectItem>
                <SelectItem value="Under behandling">Under behandling</SelectItem>
                <SelectItem value="Ferdigbehandlet">Ferdigbehandlet</SelectItem>
                <SelectItem value="Lukket">Lukket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kategori">Kategori (valgfritt)</Label>
            <Input
              id="kategori"
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              placeholder="F.eks. Teknisk, Operasjonell, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lokasjon">Lokasjon (valgfritt)</Label>
            <Input
              id="lokasjon"
              value={formData.lokasjon}
              onChange={(e) => setFormData({ ...formData, lokasjon: e.target.value })}
              placeholder="F.eks. Oslo, Hangar A, etc."
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !formData.tittel || !formData.hendelsestidspunkt}
              className="flex-1"
            >
              {submitting ? "Rapporterer..." : "Rapporter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
