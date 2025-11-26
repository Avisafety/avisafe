import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResults {
  summary: string;
  results: {
    missions: any[];
    incidents: any[];
    documents: any[];
    equipment: any[];
    drones: any[];
    competencies: any[];
    sora: any[];
  };
}

export const AISearchBar = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!query.trim() || !user) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query: query.trim(), userId: user.id }
      });

      if (error) throw error;

      setResults(data);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Kunne ikke utføre søk');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    const { missions, incidents, documents, equipment, drones, competencies, sora } = results.results;
    return missions.length + incidents.length + documents.length + 
           equipment.length + drones.length + competencies.length + sora.length;
  };

  return (
    <div className="space-y-4 mb-6">
      <GlassCard className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Søk med AI i alle data (oppdrag, hendelser, dokumenter, utstyr...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </GlassCard>

      {results && (
        <GlassCard className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Søkeresultater ({getTotalResults()})</h3>
            {results.summary && (
              <p className="text-sm text-muted-foreground">{results.summary}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.results.missions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Oppdrag ({results.results.missions.length})</h4>
                <ul className="space-y-1 text-sm">
                  {results.results.missions.map((m: any) => (
                    <li key={m.id} className="text-muted-foreground">• {m.tittel}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.results.incidents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Hendelser ({results.results.incidents.length})</h4>
                <ul className="space-y-1 text-sm">
                  {results.results.incidents.map((i: any) => (
                    <li key={i.id} className="text-muted-foreground">• {i.tittel}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.results.documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Dokumenter ({results.results.documents.length})</h4>
                <ul className="space-y-1 text-sm">
                  {results.results.documents.map((d: any) => (
                    <li key={d.id} className="text-muted-foreground">• {d.tittel}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.results.equipment.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Utstyr ({results.results.equipment.length})</h4>
                <ul className="space-y-1 text-sm">
                  {results.results.equipment.map((e: any) => (
                    <li key={e.id} className="text-muted-foreground">• {e.navn}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.results.drones.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Droner ({results.results.drones.length})</h4>
                <ul className="space-y-1 text-sm">
                  {results.results.drones.map((d: any) => (
                    <li key={d.id} className="text-muted-foreground">• {d.modell}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.results.competencies.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Kompetanser ({results.results.competencies.length})</h4>
                <ul className="space-y-1 text-sm">
                  {results.results.competencies.map((c: any) => (
                    <li key={c.id} className="text-muted-foreground">• {c.navn}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.results.sora.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">SORA-analyser ({results.results.sora.length})</h4>
                <p className="text-sm text-muted-foreground">{results.results.sora.length} analyser funnet</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
