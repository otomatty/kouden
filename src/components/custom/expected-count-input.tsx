import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type React from "react";

interface ExpectedCountInputProps {
	/** Unique identifier for the input and slider */
	id: string;
	/** Label text for the input field */
	label?: string;
	/** Current value */
	value: number;
	/** Change handler receiving the new value */
	onChange: (value: number) => void;
	/** Minimum allowed value (default 0) */
	min?: number;
	/** Maximum allowed value (default 1000) */
	max?: number;
	/** Step value for slider and numeric input (default 1) */
	step?: number;
	/** Whether the input is disabled */
	disabled?: boolean;
}

export default function ExpectedCountInput({
	id,
	label = "予想件数",
	value,
	onChange,
	min = 0,
	max = 1000,
	step = 10,
	disabled = false,
}: ExpectedCountInputProps) {
	const datalistId = `${id}-tickmarks`;
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const num = Number(e.target.value);
		onChange(Number.isNaN(num) ? min : num);
	};

	return (
		<div className="mt-4 space-y-4">
			<div className="flex items-center justify-between">
				<Label htmlFor={id}>{label}</Label>
				<Input
					id={id}
					type="number"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={handleChange}
					disabled={disabled}
					className="w-20 text-right focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
				/>
			</div>
			<input
				type="range"
				id={id}
				min={min}
				max={max}
				step={step}
				list={datalistId}
				value={value}
				onChange={handleChange}
				disabled={disabled}
				className="w-full accent-primary"
			/>
			<datalist id={datalistId}>
				<option value={min} label={String(min)} />
				<option value={(min + max) / 2} />
				<option value={max} label={String(max)} />
			</datalist>
		</div>
	);
}
