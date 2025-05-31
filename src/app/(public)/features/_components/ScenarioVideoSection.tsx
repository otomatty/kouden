"use client";

import type React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";

export type Scenario = {
	id: string;
	title: string;
	description: string;
	icon?: React.ComponentType<{ className?: string }>;
	videoUrl: string;
};

/**
 * シナリオのリストを表示し、選択されたシナリオの動画を表示します。
 */
export function ScenarioVideoSection({ scenarios }: { scenarios: Scenario[] }) {
	const [selectedId, setSelectedId] = useState<string>(scenarios[0]?.id ?? "");
	const selectedScenario = scenarios.find((s) => s.id === selectedId) as Scenario;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
			<ul className="space-y-4">
				{scenarios.map((scenario) => {
					const isSelected = scenario.id === selectedId;
					const Icon = scenario.icon;
					return (
						<li key={scenario.id}>
							<button
								type="button"
								onClick={() => setSelectedId(scenario.id)}
								className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-all ${
									isSelected
										? "bg-primary text-primary-foreground shadow"
										: "bg-card hover:bg-muted"
								}`}
							>
								{Icon && <Icon className="w-6 h-6" />}
								<div>
									<h4 className="font-semibold">{scenario.title}</h4>
									<p className="text-sm text-muted-foreground">{scenario.description}</p>
								</div>
							</button>
						</li>
					);
				})}
			</ul>
			<Card className="w-full">
				{selectedScenario && (
					<video
						src={selectedScenario.videoUrl}
						controls
						muted
						loop
						className="w-full h-auto rounded-lg"
					/>
				)}
			</Card>
		</div>
	);
}
