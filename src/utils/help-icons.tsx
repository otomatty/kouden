import {
	HelpCircle,
	Search,
	ArrowRight,
	ExternalLink,
	Gift,
	FileText,
	Users,
	Mail,
	CreditCard,
	BookOpen,
	Clock,
	Settings,
	Play,
	BarChart3,
	Shield,
	Box,
} from "lucide-react";

/**
 * アイコン名から実際のReactコンポーネントへのマッピング
 */
export const iconMap = {
	HelpCircle,
	Search,
	ArrowRight,
	ExternalLink,
	Gift,
	FileText,
	Users,
	Mail,
	CreditCard,
	BookOpen,
	Clock,
	Settings,
	Play,
	BarChart3,
	Shield,
	Box,
} as const;

export type IconName = keyof typeof iconMap;

/**
 * アイコン名からReactコンポーネントを取得する
 */
export function getIcon(iconName: string): React.ComponentType<{ className?: string }> {
	return iconMap[iconName as IconName] || HelpCircle;
}

/**
 * actionTypeに応じたデフォルトアイコンを取得する
 */
export function getActionIcon(
	actionType: "guide" | "tool" | "external" | "modal",
): React.ComponentType<{ className?: string }> {
	switch (actionType) {
		case "external":
			return ExternalLink;
		case "tool":
			return Settings;
		case "modal":
			return HelpCircle;
		default:
			return ArrowRight;
	}
}
