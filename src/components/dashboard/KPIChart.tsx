import { GlassCard } from "@/components/GlassCard";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jul", hendelser: 2 },
  { month: "Aug", hendelser: 3 },
  { month: "Sep", hendelser: 1 },
  { month: "Okt", hendelser: 4 },
  { month: "Nov", hendelser: 5 },
  { month: "Des", hendelser: 0 },
];

export const KPIChart = () => {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold">Hendelser siste 6 mnd</h2>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="month" className="text-sm" />
          <YAxis className="text-sm" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="hendelser" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};
