"use client";

import { TimeSeriesChart } from "./time-series-chart";

interface ActivityChartProps {
  data: Array<{ date: string; count: number }>;
  isLoading?: boolean;
}

export function ActivityChart({ data, isLoading }: ActivityChartProps) {
  const chartData = data.map(item => ({ date: item.date, value: item.count }));

  return (
    <TimeSeriesChart
      title="アクティビティ推移"
      description="過去30日間の香典帳作成数"
      data={chartData}
      dataKey="value"
      xAxisDataKey="date"
      isLoading={isLoading}
    />
  );
}
