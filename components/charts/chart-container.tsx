"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/loading";
import { ChartConfig, ChartDataPoint } from "@/lib/chart-adapter";
import { TimeSeriesChart } from "./time-series-chart";
import { ScatterPlot } from "./scatter-plot";
import { BarLineCombo } from "./bar-line-combo";

interface ChartContainerProps {
  dataUrl: string;
  config: ChartConfig;
  title?: string;
  onDataLoad?: (data: ChartDataPoint[]) => void;
}

export function ChartContainer({
  dataUrl,
  config,
  title,
  onDataLoad,
}: ChartContainerProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [dataUrl]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(dataUrl);
      if (!res.ok) {
        throw new Error("Failed to load chart data");
      }

      const result = await res.json();
      const chartData = result.data || [];
      setData(chartData);
      onDataLoad?.(chartData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-red-600">
          <p>{error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No data available</p>
        </div>
      );
    }

    switch (config.type) {
      case "line":
        return <TimeSeriesChart data={data} config={config} />;
      case "scatter":
        return <ScatterPlot data={data} config={config} />;
      case "combo":
        return <BarLineCombo data={data} config={config} />;
      default:
        return <TimeSeriesChart data={data} config={config} />;
    }
  };

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full" style={{ minHeight: "400px" }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}

