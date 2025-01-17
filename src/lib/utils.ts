import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * 名前からイニシャルを生成する
 */
export function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.map((word) => word.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2);
}
