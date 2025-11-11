import { GlassCard } from "@/components/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Pin } from "lucide-react";
import { mockNews } from "@/data/mockData";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

export const NewsSection = () => {
  const sortedNews = [...mockNews].sort((a, b) => {
    if (a.pin_on_top && !b.pin_on_top) return -1;
    if (!a.pin_on_top && b.pin_on_top) return 1;
    return b.publisert.getTime() - a.publisert.getTime();
  });

  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Nyheter</h2>
      </div>

      <div className="space-y-3">
        {sortedNews.map((news) => (
          <div
            key={news.id}
            className="p-4 bg-card/30 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              {news.pin_on_top && (
                <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">{news.tittel}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {news.innhold}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(news.publisert, "dd. MMM yyyy", { locale: nb })}</span>
                  <span>•</span>
                  <span>{news.forfatter}</span>
                  {news.synlighet !== "Alle" && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {news.synlighet}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
