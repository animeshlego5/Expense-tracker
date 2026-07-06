"use client";

import { useState, type ReactNode } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { formatPaise } from "@/lib/currency";

interface Slice {
  key: string;
  label: string;
  value: number; // paise
  color: string;
}

type LabelMode = "percent" | "name";

const RADIAN = Math.PI / 180;

export function CategoryPie({
  data,
  totalPaise,
  totalLabel,
}: {
  data: Slice[];
  totalPaise: number;
  totalLabel: string;
}) {
  const [labelMode, setLabelMode] = useState<LabelMode>("percent");

  return (
    <section className="rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Where it went</h2>
        {totalPaise > 0 && (
          <button
            type="button"
            aria-label={
              labelMode === "percent"
                ? "Show category names on the chart"
                : "Show percentages on the chart"
            }
            title={
              labelMode === "percent" ? "Show names" : "Show percentages"
            }
            onClick={() =>
              setLabelMode((m) => (m === "percent" ? "name" : "percent"))
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            {labelMode === "percent" ? "%" : "Aa"}
          </button>
        )}
      </div>

      {totalPaise <= 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <div className="h-24 w-24 rounded-full border-8 border-hairline" />
          <p className="text-sm text-ink-soft">No expenses yet this month</p>
        </div>
      ) : (
        <>
          <div className="relative mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                  labelLine={false}
                  label={(props: PieLabelRenderProps) =>
                    renderSliceLabel(props, labelMode)
                  }
                  isAnimationActive={false}
                >
                  {data.map((slice) => (
                    <Cell
                      key={slice.key}
                      fill={slice.color}
                      stroke="#fffcf5"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0];
                    return (
                      <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
                        <span className="font-medium text-ink">{item.name}</span>
                        <span className="ml-2 tabular-nums text-ink">
                          {formatPaise(Number(item.value))}
                        </span>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold tabular-nums text-ink">
                {totalLabel}
              </span>
              <span className="text-xs text-ink-soft">this month</span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {data.map((slice) => {
              const pct =
                totalPaise > 0
                  ? Math.round((slice.value / totalPaise) * 100)
                  : 0;
              return (
                <li key={slice.key} className="flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-ink">{slice.label}</span>
                  <span className="flex-1" />
                  <span className="tabular-nums text-ink">
                    {formatPaise(slice.value)}
                  </span>
                  <span className="w-10 text-right tabular-nums text-ink-soft">
                    {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

// Slice label drawn only on slices >= 8% of the total, in ink (not slice color).
// Shows either the percentage or the category name, per the header toggle.
function renderSliceLabel(
  props: PieLabelRenderProps,
  mode: LabelMode
): ReactNode {
  const percent = typeof props.percent === "number" ? props.percent : 0;
  if (percent < 0.08) return null;

  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const text =
    mode === "percent" ? `${Math.round(percent * 100)}%` : String(props.name ?? "");

  return (
    <text
      x={x}
      y={y}
      fill="#1f1d1a"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={mode === "percent" ? 12 : 11}
      fontWeight={600}
    >
      {text}
    </text>
  );
}
