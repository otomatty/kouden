"use client";

import { TrendingUp } from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeSeriesChartProps {
	title: string;
	description?: string;
	data: Array<{ date: string; value: number }>;
	dataKey: string;
	xAxisDataKey: string;
	isLoading?: boolean;
}

export function TimeSeriesChart({
	title,
	description,
	data,
	dataKey,
	xAxisDataKey,
	isLoading,
}: TimeSeriesChartProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-3/4" />
					{description && <Skeleton className="mt-1 h-4 w-1/2" />}
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[250px] w-full" />
				</CardContent>
				<CardFooter>
					<Skeleton className="h-4 w-1/4" />
				</CardFooter>
			</Card>
		);
	}

	const chartConfig = {
		[dataKey]: {
			label: title,
			color: "hsl(var(--chart-1))",
		},
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[250px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey={xAxisDataKey} />
							<YAxis />
							<Tooltip content={<ChartTooltipContent />} />
							<Legend />
							<Bar dataKey={dataKey} fill={chartConfig[dataKey]?.color} radius={4} />
						</BarChart>
					</ResponsiveContainer>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="flex gap-2 font-medium leading-none">
					Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
				</div>
				<div className="leading-none text-muted-foreground">Showing data for the last 30 days</div>
			</CardFooter>
		</Card>
	);
}
