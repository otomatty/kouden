import type React from "react";
import { ChevronRight } from "lucide-react";

export type SettingsListItem = {
	href: string;
	label: string;
	icon?: React.ReactNode;
	description?: string;
};

type SettingsListProps = {
	items: SettingsListItem[];
};

export const SettingsList: React.FC<SettingsListProps> = ({ items }) => {
	return (
		<ul className="divide-y divide-gray-200">
			{items.map((item) => (
				<li key={item.href}>
					<a href={item.href} className="flex items-center justify-between p-4 hover:bg-gray-50">
						<div className="flex items-center gap-4">
							{item.icon && <div className="flex-shrink-0 w-6 h-6 text-gray-400">{item.icon}</div>}
							<div>
								<p className="text-sm font-medium text-gray-900">{item.label}</p>
								{item.description && <p className="text-sm text-gray-500">{item.description}</p>}
							</div>
						</div>
						<ChevronRight className="w-5 h-5 text-gray-400" />
					</a>
				</li>
			))}
		</ul>
	);
};
