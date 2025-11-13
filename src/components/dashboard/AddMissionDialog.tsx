import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

interface AddMissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMissionAdded: () => void;
}

type Profile = Tables<"profiles">;
type Equipment = any;
type Customer = any;

export const AddMissionDialog = ({ open, onOpenChange, onMissionAdded }: AddMissionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [openPersonnelPopover, setOpenPersonnelPopover] = useState(false);
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [showNewCustomerInput, setShowNewCustomerInput] = useState(false);
  
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
      fetchCustomers();
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
    const { data, error } = await (supabase as any)
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

  const fetchCustomers = async () => {
    const { data, error } = await (supabase as any)
      .from("customers")
      .select("*")
      .eq("aktiv", true)
      .order("navn");
    
    if (error) {
      toast.error("Kunne ikke hente kunder");
      console.error(error);
    } else {
      setCustomers(data || []);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Kundenavn kan ikke være tomt");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ikke innlogget");

      const { data, error } = await (supabase as any)
        .from("customers")
        .insert({
          navn: newCustomerName.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Kunde opprettet!");
      setCustomers([...customers, data]);
      setSelectedCustomer(data.id);
      setNewCustomerName("");
      setShowNewCustomerInput(false);
      setOpenCustomerPopover(false);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Kunne ikke opprette kunde");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ikke innlogget");

      // Insert mission
      const { data: mission, error: missionError } = await (supabase as any)
        .from("missions")
        .insert({
          tittel: formData.tittel,
          lokasjon: formData.lokasjon,
          tidspunkt: formData.tidspunkt,
          beskrivelse: formData.beskrivelse,
          merknader: formData.merknader,
          status: formData.status,
          risk_nivå: formData.risk_nivå,
          customer_id: selectedCustomer || null,
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
        
        const { error: personnelError } = await (supabase as any)
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
        
        const { error: equipmentError } = await (supabase as any)
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
      setSelectedCustomer("");
      setNewCustomerName("");
      setShowNewCustomerInput(false);
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
    setOpenPersonnelPopover(false);
  };

  const removePersonnel = (profileId: string) => {
    setSelectedPersonnel(prev => prev.filter(id => id !== profileId));
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
            <Label htmlFor="kunde">Kunde</Label>
            <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomerPopover}
                  className="w-full justify-between"
                >
                  {selectedCustomer
                    ? customers.find((c) => c.id === selectedCustomer)?.navn
                    : "Velg kunde..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Søk kunde..." />
                  <CommandList>
                    <CommandEmpty>
                      <div className="p-2">
                        {showNewCustomerInput ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Kundenavn"
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCreateCustomer();
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleCreateCustomer}>
                                Opprett
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowNewCustomerInput(false);
                                  setNewCustomerName("");
                                }}
                              >
                                Avbryt
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setShowNewCustomerInput(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Legg til ny kunde
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.navn}
                          onSelect={() => {
                            setSelectedCustomer(customer.id);
                            setOpenCustomerPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {customer.navn}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Personell</Label>
            <Popover open={openPersonnelPopover} onOpenChange={setOpenPersonnelPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPersonnelPopover}
                  className="w-full justify-between"
                >
                  Velg personell...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Søk personell..." />
                  <CommandList>
                    <CommandEmpty>Ingen personell funnet.</CommandEmpty>
                    <CommandGroup>
                      {profiles.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={profile.full_name || "Ukjent"}
                          onSelect={() => togglePersonnel(profile.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPersonnel.includes(profile.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {profile.full_name || "Ukjent"}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedPersonnel.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPersonnel.map((id) => {
                  const profile = profiles.find((p) => p.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                    >
                      <span>{profile?.full_name || "Ukjent"}</span>
                      <button
                        type="button"
                        onClick={() => removePersonnel(id)}
                        className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
