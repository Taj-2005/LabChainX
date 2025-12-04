/**
 * Chart Library Adapter
 * Abstracts chart rendering to allow swapping between libraries
 */

export type ChartType = "line" | "bar" | "scatter" | "combo";

export interface ChartDataPoint {
  [key: string]: string | number | Date;
}

export interface ChartConfig {
  type: ChartType;
  xField: string;
  yField: string | string[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  colors?: string[];
  groupBy?: string;
  aggregation?: "sum" | "avg" | "min" | "max" | "count";
  smoothing?: boolean;
}

export interface ChartAdapter {
  render(
    data: ChartDataPoint[],
    config: ChartConfig,
    containerId: string
  ): void;
  destroy(containerId: string): void;
}

/**
 * Recharts adapter implementation
 */
export class RechartsAdapter implements ChartAdapter {
  render(
    data: ChartDataPoint[],
    config: ChartConfig,
    containerId: string
  ): void {
    // This is handled by React components, not imperative rendering
    // The adapter pattern is maintained for future extensibility
  }

  destroy(containerId: string): void {
    // Cleanup handled by React
  }
}

export const chartAdapter = new RechartsAdapter();

