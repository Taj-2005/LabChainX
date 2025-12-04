"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartConfig, ChartDataPoint } from "@/lib/chart-adapter";

interface TimeSeriesChartProps {
  data: ChartDataPoint[];
  config: ChartConfig;
}

export function TimeSeriesChart({ data, config }: TimeSeriesChartProps) {
  const yFields = Array.isArray(config.yField) ? config.yField : [config.yField];

  // Convert data to format expected by Recharts
  const chartData = data.map((point) => {
    const converted: Record<string, unknown> = {};
    converted[config.xField] = point[config.xField];
    yFields.forEach((field) => {
      converted[field] = point[field];
    });
    return converted;
  });

  const colors = config.colors || ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={config.xField}
          label={config.xLabel ? { value: config.xLabel, position: "insideBottom", offset: -5 } : undefined}
        />
        <YAxis
          label={config.yLabel ? { value: config.yLabel, angle: -90, position: "insideLeft" } : undefined}
        />
        <Tooltip />
        <Legend />
        {yFields.map((field, index) => (
          <Line
            key={field}
            type={config.smoothing ? "monotone" : "linear"}
            dataKey={field}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

