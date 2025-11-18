import { OpenAIPMap } from "@/components/OpenAIPMap";
import { Shield, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDialog } from "@/components/ProfileDialog";
import { PendingApprovalsBadge } from "@/components/PendingApprovalsBadge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function KartPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="h-screen flex flex-col w-full overflow-hidden">
      {/* Header */}
      <header className="bg-card/20 backdrop-blur-md border-b border-glass z-50 flex-shrink-0 w-full">
        <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 sm:gap-3 hover:bg-transparent p-0 flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              <div className="text-left">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold whitespace-nowrap">Sikkerhetsstyringssystem</h1>
                <p className="text-xs sm:text-sm lg:text-base text-primary hidden sm:block">Drone Operations Management</p>
              </div>
            </Button>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 flex-shrink">
              <Button variant="ghost" size="sm" onClick={() => navigate("/kart")}>Kart</Button>
              <Button variant="ghost" size="sm">Dokumenter</Button>
              <Button variant="ghost" size="sm">Kalender</Button>
              <Button variant="ghost" size="sm">Hendelser</Button>
              <Button variant="ghost" size="sm">Status</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/ressurser")}>Ressurser</Button>
            </nav>
            
            <nav className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
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

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        <OpenAIPMap />
      </div>
    </div>
  );
}
