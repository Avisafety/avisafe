import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface AddMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMissionAdded: () => void;
}

type Profile = Tables<"profiles">;
type Equipment = Tables<"equipment">;

export const AddMissionDialog = ({ open, onOpenChange, onMissionAdded }: AddMissionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    tittel: "",
    lokasjon: "",
    tidspunkt: "",
    beskrivelse: "",
    merknader: "",
    status: "Planlagt",
    risk_nivå: "Lav",
  });

  useEffect(() => {
    if (open) {
      fetchProfiles();
      fetchEquipment();
    }
  }, [open]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("approved", true);
    
    if (error) {
      toast.error("Kunne ikke hente personell");
      console.error(error);
    } else {
      setProfiles(data || []);
    }
  };

  const fetchEquipment = async () => {
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .eq("aktiv", true);
    
    if (error) {
      toast.error("Kunne ikke hente utstyr");
      console.error(error);
    } else {
      setEquipment(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ikke innlogget");

      // Insert mission
      const { data: mission, error: missionError } = await supabase
        .from("missions")
        .insert({
          tittel: formData.tittel,
          lokasjon: formData.lokasjon,
          tidspunkt: formData.tidspunkt,
          beskrivelse: formData.beskrivelse,
          merknader: formData.merknader,
          status: formData.status,
          risk_nivå: formData.risk_nivå,
          user_id: user.id,
        })
        .select()
        .single();

      if (missionError) throw missionError;

      // Insert mission personnel
      if (selectedPersonnel.length > 0) {
        const personnelData = selectedPersonnel.map(profileId => ({
          mission_id: mission.id,
          profile_id: profileId,
        }));
        
        const { error: personnelError } = await supabase
          .from("mission_personnel")
          .insert(personnelData);
        
        if (personnelError) throw personnelError;
      }

      // Insert mission equipment
      if (selectedEquipment.length > 0) {
        const equipmentData = selectedEquipment.map(equipmentId => ({
          mission_id: mission.id,
          equipment_id: equipmentId,
        }));
        
        const { error: equipmentError } = await supabase
          .from("mission_equipment")
          .insert(equipmentData);
        
        if (equipmentError) throw equipmentError;
      }

      toast.success("Oppdrag opprettet!");
      onMissionAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        tittel: "",
        lokasjon: "",
        tidspunkt: "",
        beskrivelse: "",
        merknader: "",
        status: "Planlagt",
        risk_nivå: "Lav",
      });
      setSelectedPersonnel([]);
      setSelectedEquipment([]);
    } catch (error) {
      console.error("Error creating mission:", error);
      toast.error("Kunne ikke opprette oppdrag");
    } finally {
      setLoading(false);
    }
  };

  const togglePersonnel = (profileId: string) => {
    setSelectedPersonnel(prev =>
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legg til oppdrag</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tittel">Tittel *</Label>
            <Input
              id="tittel"
              value={formData.tittel}
              onChange={(e) => setFormData({ ...formData, tittel: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="lokasjon">Lokasjon *</Label>
            <Input
              id="lokasjon"
              value={formData.lokasjon}
              onChange={(e) => setFormData({ ...formData, lokasjon: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="tidspunkt">Tidspunkt *</Label>
            <Input
              id="tidspunkt"
              type="datetime-local"
              value={formData.tidspunkt}
              onChange={(e) => setFormData({ ...formData, tidspunkt: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="beskrivelse">Beskrivelse</Label>
            <Textarea
              id="beskrivelse"
              value={formData.beskrivelse}
              onChange={(e) => setFormData({ ...formData, beskrivelse: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="merknader">Merknader</Label>
            <Textarea
              id="merknader"
              value={formData.merknader}
              onChange={(e) => setFormData({ ...formData, merknader: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planlagt">Planlagt</SelectItem>
                  <SelectItem value="Pågående">Pågående</SelectItem>
                  <SelectItem value="Fullført">Fullført</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="risk">Risiko</Label>
              <Select value={formData.risk_nivå} onValueChange={(value) => setFormData({ ...formData, risk_nivå: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lav">Lav</SelectItem>
                  <SelectItem value="Middels">Middels</SelectItem>
                  <SelectItem value="Høy">Høy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Personell</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {profiles.map((profile) => (
                <label key={profile.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPersonnel.includes(profile.id)}
                    onChange={() => togglePersonnel(profile.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{profile.full_name || "Ukjent"}</span>
                </label>
              ))}
              {profiles.length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen godkjente brukere funnet</p>
              )}
            </div>
          </div>

          <div>
            <Label>Utstyr</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {equipment.map((eq) => (
                <label key={eq.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEquipment.includes(eq.id)}
                    onChange={() => toggleEquipment(eq.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{eq.navn} ({eq.type})</span>
                </label>
              ))}
              {equipment.length === 0 && (
                <p className="text-sm text-muted-foreground">Ingen utstyr funnet</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opprett oppdrag
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
