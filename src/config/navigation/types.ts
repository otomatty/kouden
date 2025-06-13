import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
	title: string;
	href: string;
	icon: LucideIcon;
	description?: string;
	badge?: string;
}

export interface NavigationSection {
	title: string;
	items: NavigationItem[];
}

export interface SystemNavigationConfig {
	sections: NavigationSection[];
	quickAccess: NavigationItem[];
}
