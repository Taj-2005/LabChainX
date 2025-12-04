"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartConfig, ChartDataPoint } from "@/lib/chart-adapter";

interface ScatterPlotProps {
  data: ChartDataPoint[];
  config: ChartConfig;
}

export function ScatterPlot({ data, config }: ScatterPlotProps) {
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
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey={config.xField}
          name={config.xLabel || config.xField}
          label={config.xLabel ? { value: config.xLabel, position: "insideBottom", offset: -5 } : undefined}
        />
        <YAxis
          type="number"
          dataKey={yFields[0]}
          name={config.yLabel || yFields[0]}
          label={config.yLabel ? { value: config.yLabel, angle: -90, position: "insideLeft" } : undefined}
        />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Legend />
        {yFields.map((field, index) => (
          <Scatter
            key={field}
            name={field}
            data={chartData}
            fill={colors[index % colors.length]}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

