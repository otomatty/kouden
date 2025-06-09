"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
	name: string;
	label: string;
}

export default function TextField({ name, required, type = "text", ...rest }: TextFieldProps) {
	return (
		<div>
			<Input
				id={name}
				name={name}
				type={type}
				required={required}
				{...rest}
				className="bg-background"
			/>
		</div>
	);
}
