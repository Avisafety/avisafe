import { OpenAIPMap } from "@/components/OpenAIPMap";
import { Shield, LogOut, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
                <DropdownMenuItem>Dokumenter</DropdownMenuItem>
                <DropdownMenuItem>Kalender</DropdownMenuItem>
                <DropdownMenuItem>Hendelser</DropdownMenuItem>
                <DropdownMenuItem>Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/ressurser")}>Ressurser</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 flex-shrink">
              <Button variant="ghost" size="sm" onClick={() => navigate("/kart")}>Kart</Button>
              <Button variant="ghost" size="sm">Dokumenter</Button>
              <Button variant="ghost" size="sm">Kalender</Button>
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

      {/* Map Content */}
      <div className="flex-1 relative overflow-hidden">
        <OpenAIPMap />
      </div>
    </div>
  );
}
