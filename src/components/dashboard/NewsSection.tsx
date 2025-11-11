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
    <GlassCard className="h-auto">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">Nyheter</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedNews.map((news) => (
          <div
            key={news.id}
            className="p-3 bg-card/30 rounded hover:bg-card/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-2">
              {news.pin_on_top && (
                <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">{news.tittel}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                  {news.innhold}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{format(news.publisert, "dd. MMM", { locale: nb })}</span>
                  <span>•</span>
                  <span>{news.forfatter}</span>
                  {news.synlighet !== "Alle" && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
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
