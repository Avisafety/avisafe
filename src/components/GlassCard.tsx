import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "bg-card/40 backdrop-blur-md border border-glass rounded-lg p-3 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
};
