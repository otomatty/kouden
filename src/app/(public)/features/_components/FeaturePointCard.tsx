import type React from "react";

type FeaturePointCardProps = {
	title: string;
	description: string;
	icon?: React.ComponentType<{ className?: string }>;
};

export function FeaturePointCard({ title, description, icon: Icon }: FeaturePointCardProps) {
	return (
		<div className="p-6 rounded-lg border bg-card">
			{Icon && <Icon className="h-10 w-10 text-primary mb-4" />}
			<h3 className="text-lg font-semibold mb-2">{title}</h3>
			<p className="text-muted-foreground">{description}</p>
		</div>
	);
}
