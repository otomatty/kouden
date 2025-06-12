import { Check } from "lucide-react";

interface Feature {
	title: string;
	description: string;
}

interface FeatureDescriptionProps {
	features: Feature[];
}

/**
 * 機能説明コンポーネント
 */
export function FeatureDescription({ features }: FeatureDescriptionProps) {
	return (
		<div className="space-y-6">
			{features.map((feature) => (
				<div key={feature.title} className="group">
					<h3 className="text-lg sm:text-xl font-medium mb-2">{feature.title}</h3>
					<p className="text-muted-foreground text-sm sm:text-base">{feature.description}</p>
				</div>
			))}
		</div>
	);
}
