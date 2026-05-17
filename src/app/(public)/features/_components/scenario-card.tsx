import type React from "react";

type ScenarioCardProps = {
	id: string;
	title: string;
	description: string;
	icon?: React.ComponentType<{ className?: string }>;
};

export function ScenarioCard({ title, description, icon: Icon }: ScenarioCardProps) {
	return (
		<div className="p-6 rounded-lg border bg-card flex items-start space-x-4">
			{Icon && <Icon className="h-8 w-8 text-primary" />}
			<div>
				<h4 className="text-lg font-semibold mb-1">{title}</h4>
				<p className="text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}
