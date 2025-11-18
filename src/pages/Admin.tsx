import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Check, X, UserCog, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Profile {
  id: string;
  full_name: string | null;
  approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const availableRoles = [
  { value: "admin", label: "Administrator" },
  { value: "operativ_leder", label: "Operativ Leder" },
  { value: "pilot", label: "Pilot" },
  { value: "tekniker", label: "Tekniker" },
  { value: "lesetilgang", label: "Lesetilgang" },
];

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsAdmin(true);
        fetchData();
      } else {
        toast.error("Du har ikke tilgang til denne siden");
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Feil ved sjekking av tilgang");
      navigate("/");
    }
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      setProfiles((profilesData || []) as Profile[]);

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      setUserRoles(rolesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Feil ved henting av data");
    } finally {
      setLoadingData(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          approved: true,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        } as any)
        .eq("id", userId);

      if (error) throw error;

      toast.success("Bruker godkjent");
      fetchData();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Feil ved godkjenning av bruker");
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      // Check if role already exists
      const existingRole = userRoles.find(
        (r) => r.user_id === userId && r.role === role
      );

      if (existingRole) {
        toast.info("Bruker har allerede denne rollen");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: role as any }]);

      if (error) throw error;

      toast.success("Rolle tildelt");
      fetchData();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Feil ved tildeling av rolle");
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast.success("Rolle fjernet");
      fetchData();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Feil ved fjerning av rolle");
    }
  };

  const deleteUser = async (userId: string, userName: string | null) => {
    if (!confirm(`Er du sikker på at du vil slette brukeren ${userName || "Ikke oppgitt"}? Dette kan ikke angres.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast.success("Bruker slettet");
      fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Feil ved sletting av bruker");
    }
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter((r) => r.user_id === userId);
  };

  const getRoleLabel = (role: string) => {
    return availableRoles.find((r) => r.value === role)?.label || role;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-lg">Laster...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingUsers = profiles.filter((p) => !p.approved);
  const approvedUsers = profiles.filter((p) => p.approved);

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <header className="bg-card border-b sticky top-0 z-50 w-full">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-shrink-0">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">Administrator Panel</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Brukergodkjenning og rolletildeling</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/")} className="flex-shrink-0">
              Tilbake til Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-8">
        <div className="space-y-6">
          {/* Pending Users */}
          {pendingUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  Ventende godkjenninger ({pendingUsers.length})
                </CardTitle>
                <CardDescription>
                  Brukere som venter på godkjenning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navn</TableHead>
                      <TableHead>Bruker ID</TableHead>
                      <TableHead>Opprettet</TableHead>
                      <TableHead className="text-right">Handlinger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>{profile.full_name || "Ikke oppgitt"}</TableCell>
                        <TableCell className="font-mono text-xs">{profile.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          {new Date(profile.created_at).toLocaleDateString("nb-NO")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              onClick={() => approveUser(profile.id)}
                              className="gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Godkjenn
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteUser(profile.id, profile.full_name)}
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Slett
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Approved Users */}
          <Card>
            <CardHeader>
              <CardTitle>Godkjente brukere ({approvedUsers.length})</CardTitle>
              <CardDescription>
                Administrer roller for godkjente brukere
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead>Bruker ID</TableHead>
                    <TableHead>Roller</TableHead>
                    <TableHead className="text-right">Tildel rolle</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedUsers.map((profile) => {
                    const roles = getUserRoles(profile.id);
                    return (
                      <TableRow key={profile.id}>
                        <TableCell>{profile.full_name || "Ikke oppgitt"}</TableCell>
                        <TableCell className="font-mono text-xs">{profile.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {roles.length > 0 ? (
                              roles.map((role) => (
                                <Badge
                                  key={role.id}
                                  variant="secondary"
                                  className="gap-2 cursor-pointer hover:bg-destructive/10"
                                  onClick={() => removeRole(role.id)}
                                >
                                  {getRoleLabel(role.role)}
                                  <X className="w-3 h-3" />
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Ingen roller
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select onValueChange={(value) => assignRole(profile.id, value)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Velg rolle" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(profile.id, profile.full_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
