import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Plus, Shield, LogOut, Settings, Menu } from "lucide-react";
import DocumentsFilterBar from "@/components/documents/DocumentsFilterBar";
import DocumentsList from "@/components/documents/DocumentsList";
import DocumentCardModal from "@/components/documents/DocumentCardModal";
import { toast } from "sonner";
import droneBackground from "@/assets/drone-background.png";
import { ProfileDialog } from "@/components/ProfileDialog";
import { PendingApprovalsBadge } from "@/components/PendingApprovalsBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export type DocumentCategory = "regelverk" | "prosedyrer" | "sjekklister" | "rapporter" | "nettsider" | "annet";
export interface Document {
  id: string;
  tittel: string;
  beskrivelse: string | null;
  kategori: string;
  gyldig_til: string | null;
  varsel_dager_for_utløp: number | null;
  fil_url: string | null;
  nettside_url: string | null;
  opprettet_dato: string;
  oppdatert_dato: string | null;
  opprettet_av: string | null;
}
const Documents = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const {
    isAdmin
  } = useAdminCheck();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<DocumentCategory[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const {
    data: documents,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("documents").select("*").order("opprettet_dato", {
        ascending: false
      });
      if (error) throw error;
      return data as Document[];
    }
  });
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = searchQuery === "" || doc.tittel.toLowerCase().includes(searchQuery.toLowerCase()) || doc.beskrivelse?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.fil_url?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.nettside_url?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(doc.kategori as DocumentCategory);
    return matchesSearch && matchesCategory;
  });
  const handleOpenDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsCreating(false);
    setIsModalOpen(true);
  };
  const handleCreateNew = () => {
    setSelectedDocument(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setIsCreating(false);
  };
  const handleSaveSuccess = () => {
    refetch();
    handleCloseModal();
    toast.success(isCreating ? "Dokument opprettet" : "Dokument oppdatert");
  };
  const handleDeleteSuccess = () => {
    refetch();
    handleCloseModal();
    toast.success("Dokument slettet");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };
  return <div className="min-h-screen relative w-full overflow-x-hidden">
      {/* Background with gradient overlay */}
      <div className="fixed inset-0 z-0" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${droneBackground})`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
      backgroundAttachment: "fixed",
      backgroundRepeat: "no-repeat"
    }} />

      {/* Content */}
      <div className="relative z-10 w-full">
        {/* Header */}
        <header className="bg-card/20 backdrop-blur-md border-b border-glass sticky top-0 z-50 w-full">
          <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 sm:gap-2 lg:gap-3 hover:bg-transparent p-0 flex-shrink-0"
                onClick={() => navigate("/")}
              >
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-primary" />
                <div className="text-left">
                  <h1 className="text-sm sm:text-base lg:text-xl xl:text-2xl font-bold whitespace-nowrap">SMS</h1>
                  <p className="text-xs lg:text-sm text-primary hidden lg:block">Drone Operations</p>
                </div>
              </Button>
              
              {/* Mobile Navigation - Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-card/95 backdrop-blur-md border-glass z-50">
                  <DropdownMenuItem onClick={() => navigate("/kart")}>Kart</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dokumenter")}>Dokumenter</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/kalender")}>Kalender</DropdownMenuItem>
                  <DropdownMenuItem>Hendelser</DropdownMenuItem>
                  <DropdownMenuItem>Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/ressurser")}>Ressurser</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 flex-shrink">
                <Button variant="ghost" size="sm" onClick={() => navigate("/kart")}>Kart</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dokumenter")}>Dokumenter</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/kalender")}>Kalender</Button>
                <Button variant="ghost" size="sm">Hendelser</Button>
                <Button variant="ghost" size="sm">Status</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/ressurser")}>Ressurser</Button>
              </nav>
              
              <nav className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="gap-2 relative"
                    title="Administrator"
                  >
                    <Settings className="w-4 h-4" />
                    <PendingApprovalsBadge isAdmin={isAdmin} />
                  </Button>
                )}
                <ProfileDialog />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  title="Logg ut"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-3 sm:px-4 py-3 sm:py-5">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-foreground">Dokumenter</h1>
              {isAdmin && <Button onClick={handleCreateNew} size="lg">
                  <Plus className="mr-2" />
                  Nytt dokument
                </Button>}
            </div>

            <DocumentsFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategories={selectedCategories} onCategoriesChange={setSelectedCategories} />

            <DocumentsList documents={filteredDocuments || []} isLoading={isLoading} onDocumentClick={handleOpenDocument} />

            <DocumentCardModal document={selectedDocument} isOpen={isModalOpen} onClose={handleCloseModal} onSaveSuccess={handleSaveSuccess} onDeleteSuccess={handleDeleteSuccess} isAdmin={isAdmin} isCreating={isCreating} />
          </div>
        </main>
      </div>
    </div>;
};
export default Documents;