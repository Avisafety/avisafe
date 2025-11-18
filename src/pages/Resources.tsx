import droneBackground from "@/assets/drone-background.png";
import { Shield, ArrowLeft, Plus, Plane, Gauge, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

const Resources = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drones, setDrones] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [droneDialogOpen, setDroneDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [personnelDialogOpen, setPersonnelDialogOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [personSearchOpen, setPersonSearchOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDrones();
      fetchEquipment();
      fetchPersonnel();
    }
  }, [user]);

  const fetchDrones = async () => {
    const { data, error } = await (supabase as any)
      .from("drones")
      .select("*")
      .eq("aktiv", true)
      .order("opprettet_dato", { ascending: false });
    
    if (error) {
      console.error("Error fetching drones:", error);
      toast.error("Kunne ikke hente droner");
    } else {
      setDrones(data || []);
    }
  };

  const fetchEquipment = async () => {
    const { data, error } = await (supabase as any)
      .from("equipment")
      .select("*")
      .eq("aktiv", true)
      .order("opprettet_dato", { ascending: false });
    
    if (error) {
      console.error("Error fetching equipment:", error);
      toast.error("Kunne ikke hente utstyr");
    } else {
      setEquipment(data || []);
    }
  };

  const fetchPersonnel = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, personnel_competencies(*)")
      .eq("approved", true)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching personnel:", error);
      toast.error("Kunne ikke hente personell");
    } else {
      setPersonnel(data || []);
    }
  };

  const handleAddDrone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await (supabase as any).from("drones").insert([{
      user_id: user?.id!,
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
      setDroneDialogOpen(false);
      fetchDrones();
    }
  };

  const handleAddEquipment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { error } = await (supabase as any).from("equipment").insert([{
      user_id: user?.id!,
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
      setEquipmentDialogOpen(false);
      fetchEquipment();
    }
  };

  const handleAddCompetency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!selectedPersonId) {
      toast.error("Vennligst velg en person");
      return;
    }
    
    const { error } = await (supabase as any).from("personnel_competencies").insert([{
      profile_id: selectedPersonId,
      type: formData.get("type") as string,
      navn: formData.get("navn") as string,
      beskrivelse: (formData.get("beskrivelse") as string) || null,
      utstedt_dato: (formData.get("utstedt_dato") as string) || null,
      utloper_dato: (formData.get("utloper_dato") as string) || null,
    }]);

    if (error) {
      console.error("Error adding competency:", error);
      toast.error("Kunne ikke legge til kompetanse");
    } else {
      toast.success("Kompetanse lagt til");
      setPersonnelDialogOpen(false);
      setSelectedPersonId("");
      fetchPersonnel();
    }
  };

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                <div>
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold whitespace-nowrap">Ressurser</h1>
                  <p className="text-xs sm:text-sm lg:text-base text-primary hidden sm:block">Administrer droner, utstyr og personell</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Tilbake
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-3 sm:px-4 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Droner Section */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Droner</h2>
                </div>
                <Dialog open={droneDialogOpen} onOpenChange={setDroneDialogOpen}>
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
              </div>
              <div className="space-y-3">
                {drones.map((drone) => (
                  <div key={drone.id} className="p-3 bg-background/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{drone.modell}</h3>
                        <p className="text-sm text-muted-foreground">{drone.registrering}</p>
                      </div>
                      <StatusBadge status={drone.status as any} />
                    </div>
                    <div className="text-sm space-y-1">
                      <p>Flyvetimer: {drone.flyvetimer}</p>
                      {drone.neste_inspeksjon && (
                        <p>Neste inspeksjon: {format(new Date(drone.neste_inspeksjon), "dd.MM.yyyy")}</p>
                      )}
                    </div>
                  </div>
                ))}
                {drones.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen droner registrert
                  </p>
                )}
              </div>
            </GlassCard>

            {/* Utstyr Section */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Utstyr</h2>
                </div>
                <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
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
              </div>
              <div className="space-y-3">
                {equipment.map((item) => (
                  <div key={item.id} className="p-3 bg-background/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{item.navn}</h3>
                        <p className="text-sm text-muted-foreground">{item.type}</p>
                      </div>
                      <StatusBadge status={item.status as any} />
                    </div>
                    <div className="text-sm space-y-1">
                      <p>SN: {item.serienummer}</p>
                      {item.neste_vedlikehold && (
                        <p>Neste vedlikehold: {format(new Date(item.neste_vedlikehold), "dd.MM.yyyy")}</p>
                      )}
                    </div>
                  </div>
                ))}
                {equipment.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen utstyr registrert
                  </p>
                )}
              </div>
            </GlassCard>

            {/* Personell Section */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Personell</h2>
                </div>
                <Dialog open={personnelDialogOpen} onOpenChange={setPersonnelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Legg til kompetanse
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Legg til kompetanse/kurs</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCompetency} className="space-y-4">
                       <div>
                        <Label>Person</Label>
                        <Popover open={personSearchOpen} onOpenChange={setPersonSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={personSearchOpen}
                              className="w-full justify-between"
                            >
                              {selectedPersonId
                                ? personnel.find((p) => p.id === selectedPersonId)?.full_name || "Velg person..."
                                : "Velg person..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0 z-50 bg-popover" align="start">
                            <Command className="bg-popover">
                              <CommandInput placeholder="Søk etter person..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>Ingen personer funnet.</CommandEmpty>
                                <CommandGroup>
                                  {personnel.map((person) => (
                                    <CommandItem
                                      key={person.id}
                                      value={person.full_name || ""}
                                      onSelect={() => {
                                        setSelectedPersonId(person.id);
                                        setPersonSearchOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedPersonId === person.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {person.full_name || "Ukjent navn"}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" defaultValue="Kurs">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Kurs">Kurs</SelectItem>
                            <SelectItem value="Sertifikat">Sertifikat</SelectItem>
                            <SelectItem value="Kompetanse">Kompetanse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="navn">Navn</Label>
                        <Input id="navn" name="navn" required />
                      </div>
                      <div>
                        <Label htmlFor="beskrivelse">Beskrivelse</Label>
                        <Textarea id="beskrivelse" name="beskrivelse" />
                      </div>
                      <div>
                        <Label htmlFor="utstedt_dato">Utstedt dato</Label>
                        <Input id="utstedt_dato" name="utstedt_dato" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="utloper_dato">Utløper dato</Label>
                        <Input id="utloper_dato" name="utloper_dato" type="date" />
                      </div>
                      <Button type="submit" className="w-full">Legg til kompetanse</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {personnel.map((person) => (
                  <div key={person.id} className="p-3 bg-background/50 rounded-lg border border-border">
                    <h3 className="font-semibold mb-2">{person.full_name || "Ukjent navn"}</h3>
                    <div className="text-sm space-y-1">
                      {person.personnel_competencies && person.personnel_competencies.length > 0 ? (
                        person.personnel_competencies.map((comp: any) => (
                          <div key={comp.id} className="flex justify-between items-center py-1">
                            <span>{comp.navn}</span>
                            {comp.utloper_dato && (
                              <span className="text-xs text-muted-foreground">
                                Utløper: {format(new Date(comp.utloper_dato), "dd.MM.yyyy")}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Ingen kompetanser registrert</p>
                      )}
                    </div>
                  </div>
                ))}
                {personnel.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ingen personell registrert
                  </p>
                )}
              </div>
            </GlassCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Resources;
