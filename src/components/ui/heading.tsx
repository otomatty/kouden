import { cn } from "@/lib/utils";

/**
 * Heading component for styled headings.
 * @param {number} level The heading level (1-6). Defaults to 2.
 * @param children The heading content.
 * @param className Additional CSS classes.
 */
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
	level?: 1 | 2 | 3 | 4 | 5 | 6;
	className?: string;
	children: React.ReactNode;
}

// Restrict Tag to valid heading elements h1–h6
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingTag = `h${HeadingLevel}`;

export function Heading({ level = 2, className, children, ...props }: HeadingProps) {
	const Tag = `h${level}` as HeadingTag;
	const sizeClasses: Record<number, string> = {
		1: "text-2xl",
		2: "text-xl",
		3: "text-lg",
		4: "text-base",
		5: "text-base",
		6: "text-base",
	};

	return (
		<Tag
			className={cn(`${sizeClasses[level]} font-semibold mt-8 mb-4 text-gray-900`, className)}
			{...props}
		>
			{children}
		</Tag>
	);
}
