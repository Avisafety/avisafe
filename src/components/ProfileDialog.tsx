import { useState, useEffect } from "react";
import { User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PendingApprovalsBadge } from "./PendingApprovalsBadge";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface UserRole {
  role: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  type: string;
}

interface Incident {
  id: string;
  tittel: string;
  hendelsestidspunkt: string;
  status: string;
}

export const ProfileDialog = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesData) {
        setRoles(rolesData);
        setIsAdmin(rolesData.some(role => role.role === "admin"));
      }

      // Fetch calendar events
      const { data: eventsData } = await supabase
        .from("calendar_events")
        .select("id, title, event_date, type")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (eventsData) {
        setCalendarEvents(eventsData);
      }

      // Fetch incidents
      const { data: incidentsData } = await supabase
        .from("incidents")
        .select("id, tittel, hendelsestidspunkt, status")
        .eq("user_id", user.id)
        .order("hendelsestidspunkt", { ascending: false });

      if (incidentsData) {
        setIncidents(incidentsData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "operativ_leder":
        return "default";
      case "pilot":
      case "tekniker":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      admin: "Administrator",
      operativ_leder: "Operativ leder",
      pilot: "Pilot",
      tekniker: "Tekniker",
      lesetilgang: "Lesetilgang",
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("no-NO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Min profil" className="relative">
          <User className="w-4 h-4" />
          <PendingApprovalsBadge isAdmin={isAdmin} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Min profil</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-100px)] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Laster...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Profilinformasjon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">
                        {profile?.full_name || "Ikke satt"}
                      </p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Roles */}
              <Card>
                <CardHeader>
                  <CardTitle>Roller</CardTitle>
                </CardHeader>
                <CardContent>
                  {roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role, index) => (
                        <Badge key={index} variant={getRoleBadgeVariant(role.role)}>
                          {getRoleDisplayName(role.role)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen roller tildelt</p>
                  )}
                </CardContent>
              </Card>

              {/* Calendar Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Mine kalenderhendelser ({calendarEvents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {calendarEvents.length > 0 ? (
                    <div className="space-y-2">
                      {calendarEvents.slice(0, 5).map((event) => (
                        <div key={event.id} className="flex justify-between items-center py-2">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {event.type} • {formatDate(event.event_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {calendarEvents.length > 5 && (
                        <p className="text-xs text-muted-foreground pt-2">
                          + {calendarEvents.length - 5} flere hendelser
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen kalenderhendelser</p>
                  )}
                </CardContent>
              </Card>

              {/* Incidents */}
              <Card>
                <CardHeader>
                  <CardTitle>Mine hendelser ({incidents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {incidents.length > 0 ? (
                    <div className="space-y-2">
                      {incidents.slice(0, 5).map((incident) => (
                        <div key={incident.id} className="flex justify-between items-center py-2">
                          <div>
                            <p className="font-medium">{incident.tittel}</p>
                            <p className="text-xs text-muted-foreground">
                              {incident.status} • {formatDate(incident.hendelsestidspunkt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {incidents.length > 5 && (
                        <p className="text-xs text-muted-foreground pt-2">
                          + {incidents.length - 5} flere hendelser
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ingen hendelser</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
