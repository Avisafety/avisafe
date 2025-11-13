import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Pin, User, Calendar } from "lucide-react";

type News = Tables<"news">;

interface NewsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: News | null;
}

export const NewsDetailDialog = ({ open, onOpenChange, news }: NewsDetailDialogProps) => {
  if (!news) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-2">
            {news.pin_on_top && (
              <Pin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            )}
            <DialogTitle className="text-xl">{news.tittel}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground border-b border-border pb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(news.publisert), "dd. MMMM yyyy, HH:mm", { locale: nb })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{news.forfatter}</span>
            </div>
            {news.synlighet !== "Alle" && (
              <Badge variant="outline" className="text-xs">
                {news.synlighet}
              </Badge>
            )}
          </div>
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {news.innhold}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};