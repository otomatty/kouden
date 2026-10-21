import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
	<nav
		aria-label="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...props}
	/>
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
	({ className, ...props }, ref) => (
		<ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
	),
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
	({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />,
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
	isActive?: boolean;
} & Pick<VariantProps<typeof buttonVariants>, "size"> &
	(
		| (React.ComponentProps<"a"> & { href: string })
		| (React.ComponentProps<"button"> & { href?: never })
	);

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => {
	const baseClassName = cn(
		buttonVariants({
			variant: isActive ? "outline" : "ghost",
			size,
		}),
		className,
	);

	if ("href" in props && props.href) {
		return <a aria-current={isActive ? "page" : undefined} className={baseClassName} {...props} />;
	}

	const { type = "button", ...buttonProps } = props;
	return (
		<button
			type={type as "button" | "submit" | "reset"}
			aria-current={isActive ? "page" : undefined}
			className={baseClassName}
			{...(buttonProps as React.ComponentProps<"button">)}
		/>
	);
};
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
	className,
	size = "default",
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="前のページに移動"
		size={size}
		className={cn("gap-1 pl-2.5", className)}
		{...props}
	>
		<ChevronLeft className="h-4 w-4" />
		<span>前へ</span>
	</PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
	className,
	size = "default",
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="次のページに移動"
		size={size}
		className={cn("gap-1 pr-2.5", className)}
		{...props}
	>
		<span>次へ</span>
		<ChevronRight className="h-4 w-4" />
	</PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
	<span
		aria-hidden
		className={cn("flex h-9 w-9 items-center justify-center", className)}
		{...props}
	>
		<MoreHorizontal className="h-4 w-4" />
		<span className="sr-only">その他のページ</span>
	</span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
