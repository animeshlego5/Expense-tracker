"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPaise, formatPaiseCompact } from "@/lib/currency";

interface MonthDatum {
  month: string;
  label: string;
  incomePaise: number;
  expensePaise: number;
}

export function MonthlyTracker({ data }: { data: MonthDatum[] }) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-4">
      <h2 className="text-base font-semibold text-ink">Last 6 months</h2>
      <div className="mt-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barGap={2}
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#e7e1d3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "#e7e1d3" }}
              tick={{ fontSize: 12, fill: "#52514e" }}
            />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#52514e" }}
              tickFormatter={(value: number) => formatPaiseCompact(Number(value))}
            />
            <Tooltip
              cursor={{ fill: "#1f1d1a", fillOpacity: 0.04 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                return (
                  <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
                    <p className="mb-1 font-medium text-ink">{label}</p>
                    {payload.map((entry) => (
                      <p
                        key={String(entry.dataKey)}
                        className="flex items-center gap-2"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-ink-soft">{entry.name}</span>
                        <span className="ml-auto tabular-nums text-ink">
                          {formatPaise(Number(entry.value))}
                        </span>
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            <Bar
              dataKey="incomePaise"
              name="Income"
              fill="#008300"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
            <Bar
              dataKey="expensePaise"
              name="Expenses"
              fill="#e34948"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
