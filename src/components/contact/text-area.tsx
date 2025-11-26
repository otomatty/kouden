"use client";

import { Textarea } from "@/components/ui/textarea";
import type { TextareaHTMLAttributes } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	name: string;
	label: string;
}

export default function TextArea({ name, required, ...rest }: TextAreaProps) {
	return (
		<div>
			<Textarea
				id={name}
				name={name}
				required={required}
				className="min-h-[200px] bg-background"
				{...rest}
			/>
		</div>
	);
}
