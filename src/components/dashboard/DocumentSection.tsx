import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, AlertCircle, Upload, X, Link } from "lucide-react";
import { Document } from "@/types";
import { useState, useRef, useEffect } from "react";
import { DocumentDetailDialog } from "./DocumentDetailDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [uploadType, setUploadType] = useState<"file" | "url">("file");
  const [formData, setFormData] = useState({
    tittel: "",
    kategori: "Policy",
    gyldig_til: "",
    varsel_dager_for_utløp: "30",
    url: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedDocStatus, setSelectedDocStatus] = useState<string>("Grønn");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('opprettet_dato', { ascending: false });

      if (error) throw error;

      const mappedDocuments: Document[] = (data || []).map((doc) => ({
        id: doc.id,
        tittel: doc.tittel,
        kategori: doc.kategori as any,
        versjon: doc.versjon || "1.0",
        gyldig_til: doc.gyldig_til ? new Date(doc.gyldig_til) : undefined,
        sist_endret: doc.oppdatert_dato ? new Date(doc.oppdatert_dato) : new Date(doc.opprettet_dato!),
        varsel_dager_for_utløp: doc.varsel_dager_for_utløp || 30,
        synlighet: "Intern" as any,
        fil_url: doc.fil_url,
        fil_navn: doc.fil_navn,
        utsteder: doc.opprettet_av,
        merknader: undefined,
      }));

      setDocuments(mappedDocuments);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Kunne ikke hente dokumenter');
    } finally {
      setLoading(false);
    }
  };

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
    if (!formData.tittel) {
      toast.error("Vennligst fyll ut tittel");
      return;
    }

    if (uploadType === "file" && !selectedFile) {
      toast.error("Vennligst velg en fil");
      return;
    }

    if (uploadType === "url" && !formData.url) {
      toast.error("Vennligst legg inn en URL");
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

      let filePath = "";
      let fileName = "";
      let fileSize = 0;

      if (uploadType === "file" && selectedFile) {
        // Upload file to storage
        const fileExt = selectedFile.name.split('.').pop();
        filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        fileName = selectedFile.name;
        fileSize = selectedFile.size;
      } else if (uploadType === "url") {
        // For URL, store the URL directly in fil_url
        filePath = formData.url;
        fileName = formData.tittel; // Use title as filename for URLs
      }
      
      // Insert document metadata into database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          tittel: formData.tittel,
          kategori: formData.kategori,
          gyldig_til: formData.gyldig_til || null,
          varsel_dager_for_utløp: parseInt(formData.varsel_dager_for_utløp),
          fil_url: filePath,
          fil_navn: fileName,
          fil_storrelse: fileSize,
        });

      if (dbError) throw dbError;

      toast.success(uploadType === "file" ? "Dokument lastet opp!" : "Dokument lenke lagt til!");
      setDialogOpen(false);
      setSelectedFile(null);
      setUploadType("file");
      setFormData({
        tittel: "",
        kategori: "Policy",
        gyldig_til: "",
        varsel_dager_for_utløp: "30",
        url: "",
      });
      
      // Refresh document list
      fetchDocuments();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Feil ved opplasting: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentClick = (doc: Document, status: string) => {
    setSelectedDocument(doc);
    setSelectedDocStatus(status);
    setDetailDialogOpen(true);
  };

  return (
    <>
      <GlassCard className="h-[400px] flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <h2 className="text-sm sm:text-base font-semibold truncate">Dokumenter</h2>
        </div>
        <Button size="sm" className="gap-1 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0" onClick={() => setDialogOpen(true)}>
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Legg til</span>
        </Button>
      </div>

      <div className="relative mb-2 sm:mb-3">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
        <Input placeholder="Søk..." className="pl-7 sm:pl-8 h-8 sm:h-9 text-xs sm:text-sm" />
      </div>

      <div className="space-y-1.5 sm:space-y-2 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs sm:text-sm text-muted-foreground">Laster dokumenter...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs sm:text-sm text-muted-foreground">Ingen dokumenter lagt til ennå</p>
          </div>
        ) : (
          documents.map((doc) => {
            const status = getDocumentStatus(doc);
            return (
              <div
                key={doc.id}
                onClick={() => handleDocumentClick(doc, status)}
                className="flex items-center justify-between p-2 sm:p-3 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  <StatusDot status={status} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm truncate">{doc.tittel}</h3>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      <span className="px-1.5 sm:px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] sm:text-xs">
                        {doc.kategori}
                      </span>
                      <span>v{doc.versjon}</span>
                    </div>
                  </div>
                </div>
                
                {status !== "Grønn" && doc.gyldig_til && (
                  <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs flex-shrink-0">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                    <span className={status === "Rød" ? "text-destructive font-medium" : "text-status-yellow"}>
                      {status === "Rød" ? "Utløpt" : "Snart"}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Last opp dokument</DialogTitle>
            <DialogDescription>
              Last opp et nytt dokument til systemet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <RadioGroup value={uploadType} onValueChange={(value: "file" | "url") => setUploadType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file" id="file-option" />
                  <Label htmlFor="file-option" className="font-normal cursor-pointer">Last opp fil</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="url-option" />
                  <Label htmlFor="url-option" className="font-normal cursor-pointer">Lenke til dokument</Label>
                </div>
              </RadioGroup>
            </div>

            {uploadType === "file" ? (
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
            ) : (
              <div className="space-y-2">
                <Label htmlFor="url">Dokument URL *</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://eksempel.no/dokument.pdf"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

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
                disabled={uploading || !formData.tittel || (uploadType === "file" && !selectedFile) || (uploadType === "url" && !formData.url)}
                className="flex-1"
              >
                {uploading ? "Lagrer..." : uploadType === "file" ? "Last opp" : "Legg til"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <DocumentDetailDialog 
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        document={selectedDocument}
        status={selectedDocStatus}
      />
    </GlassCard>
    </>
  );
};
