"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	name: string;
	label: string;
}

export default function TextField({
	name,
	required,
	type = "text",
	className,
	...rest
}: TextFieldProps) {
	return (
		<div>
			<Input
				id={name}
				name={name}
				type={type}
				required={required}
				className={cn("bg-background", className)}
				{...rest}
			/>
		</div>
	);
}
