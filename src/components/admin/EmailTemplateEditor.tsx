import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Save, Eye, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailTemplate {
  id: string;
  company_id: string;
  template_type: string;
  subject: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const EmailTemplateEditor = () => {
  const { companyId } = useAuth();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [companyId]);

  const fetchTemplate = async () => {
    if (!companyId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("company_id", companyId)
        .eq("template_type", "customer_welcome")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTemplate(data);
        setSubject(data.subject);
        setContent(data.content);
      }
    } catch (error: any) {
      console.error("Error fetching template:", error);
      toast.error("Kunne ikke laste mal");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) {
      toast.error("Du må være logget inn");
      return;
    }

    setSaving(true);
    try {
      if (template) {
        // Update existing template
        const { error } = await supabase
          .from("email_templates")
          .update({
            subject,
            content,
          })
          .eq("id", template.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from("email_templates")
          .insert({
            company_id: companyId,
            template_type: "customer_welcome",
            subject,
            content,
          });

        if (error) throw error;
      }

      toast.success("Mal lagret");
      fetchTemplate();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error("Kunne ikke lagre mal: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (template) {
      setSubject(template.subject);
      setContent(template.content);
      toast.info("Endringer tilbakestilt");
    }
  };

  const getPreviewContent = () => {
    return content
      .replace(/\{\{customer_name\}\}/g, "Ola Nordmann")
      .replace(/\{\{company_name\}\}/g, "Ditt Selskap");
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Laster mal...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Kunde Velkomst E-post</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tilbakestill
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Forhåndsvis
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Lagrer..." : "Lagre mal"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Tilgjengelige variabler:</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{"{{customer_name}}"}</code> - Kundens navn</p>
              <p><code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{"{{company_name}}"}</code> - Selskapets navn</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">E-post emne</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Skriv inn e-post emne..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">E-post innhold (HTML)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv inn HTML-innhold..."
              rows={20}
              className="font-mono text-sm"
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Tips: Du kan bruke HTML og inline CSS for å style e-posten.</p>
          </div>
        </div>
      </GlassCard>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Forhåndsvisning av e-post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Emne:</Label>
              <p className="font-semibold">
                {subject.replace(/\{\{company_name\}\}/g, "Ditt Selskap")}
              </p>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div 
                dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                className="bg-white"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
