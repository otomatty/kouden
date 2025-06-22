"use client";

import { TimeSeriesChart } from "./time-series-chart";

interface SalesChartProps {
  data: Array<{ date: string; sales: number }>;
  isLoading?: boolean;
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
  const chartData = data.map(item => ({ date: item.date, value: item.sales }));

  return (
    <TimeSeriesChart
      title="売上推移"
      description="過去30日間の売上データ"
      data={chartData}
      dataKey="value"
      xAxisDataKey="date"
      isLoading={isLoading}
    />
  );
}
