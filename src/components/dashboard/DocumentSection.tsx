import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, AlertCircle, Upload, X } from "lucide-react";
import { mockDocuments } from "@/data/mockData";
import { Document } from "@/types";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const getDocumentStatus = (doc: Document) => {
  if (!doc.gyldig_til) return "Grønn";
  
  const today = new Date();
  const daysUntilExpiry = Math.floor(
    (doc.gyldig_til.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry < 0) return "Rød";
  if (daysUntilExpiry <= doc.varsel_dager_for_utløp) return "Gul";
  return "Grønn";
};

const StatusDot = ({ status }: { status: string }) => {
  const colors = {
    Grønn: "bg-status-green",
    Gul: "bg-status-yellow",
    Rød: "bg-status-red",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors]}`} />;
};

export const DocumentSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    tittel: "",
    kategori: "Policy",
    gyldig_til: "",
    varsel_dager_for_utløp: "30",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Filen er for stor. Maksimal størrelse er 10MB");
        return;
      }
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!formData.tittel) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setFormData({ ...formData, tittel: nameWithoutExt });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.tittel) {
      toast.error("Vennligst fyll ut alle påkrevde felt");
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Du må være logget inn for å laste opp dokumenter");
        setUploading(false);
        return;
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Insert document metadata into database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          tittel: formData.tittel,
          kategori: formData.kategori,
          gyldig_til: formData.gyldig_til || null,
          varsel_dager_for_utløp: parseInt(formData.varsel_dager_for_utløp),
          fil_url: publicUrl,
          fil_navn: selectedFile.name,
          fil_storrelse: selectedFile.size,
        });

      if (dbError) throw dbError;

      toast.success("Dokument lastet opp!");
      setDialogOpen(false);
      setSelectedFile(null);
      setFormData({
        tittel: "",
        kategori: "Policy",
        gyldig_til: "",
        varsel_dager_for_utløp: "30",
      });
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Feil ved opplasting: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <GlassCard className="h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Dokumenter</h2>
        </div>
        <Button size="sm" className="gap-1 h-8 text-sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Legg til
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Søk..." className="pl-8 h-9 text-sm" />
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {mockDocuments.map((doc) => {
          const status = getDocumentStatus(doc);
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                <StatusDot status={status} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{doc.tittel}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                      {doc.kategori}
                    </span>
                    <span>v{doc.versjon}</span>
                  </div>
                </div>
              </div>
              
              {status !== "Grønn" && doc.gyldig_til && (
                <div className="flex items-center gap-1 text-xs">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className={status === "Rød" ? "text-destructive font-medium" : "text-status-yellow"}>
                    {status === "Rød" ? "Utløpt" : "Snart"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Last opp dokument</DialogTitle>
            <DialogDescription>
              Last opp et nytt dokument til systemet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Fil *</Label>
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              
              {!selectedFile ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Velg fil
                </Button>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <FileText className="w-4 h-4" />
                  <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tittel">Tittel *</Label>
              <Input
                id="tittel"
                value={formData.tittel}
                onChange={(e) => setFormData({ ...formData, tittel: e.target.value })}
                placeholder="F.eks. Sikkerhetsmanual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kategori">Kategori</Label>
              <Select
                value={formData.kategori}
                onValueChange={(value) => setFormData({ ...formData, kategori: value })}
              >
                <SelectTrigger id="kategori">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Policy">Policy</SelectItem>
                  <SelectItem value="Prosedyre">Prosedyre</SelectItem>
                  <SelectItem value="Sertifikat">Sertifikat</SelectItem>
                  <SelectItem value="Forsikring">Forsikring</SelectItem>
                  <SelectItem value="Annet">Annet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gyldig_til">Utløpsdato (valgfritt)</Label>
              <Input
                id="gyldig_til"
                type="date"
                value={formData.gyldig_til}
                onChange={(e) => setFormData({ ...formData, gyldig_til: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="varsel">Varsel dager før utløp</Label>
              <Input
                id="varsel"
                type="number"
                value={formData.varsel_dager_for_utløp}
                onChange={(e) => setFormData({ ...formData, varsel_dager_for_utløp: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedFile(null);
                }}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !formData.tittel}
                className="flex-1"
              >
                {uploading ? "Laster opp..." : "Last opp"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
};
