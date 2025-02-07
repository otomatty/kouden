export interface SelectOption {
	value: string;
	label: string;
}

export interface AdditionalSelectProps {
	label: string;
	options: SelectOption[];
	value: string | null;
	placeholder?: string;
	disabled?: boolean;
	onValueChange: (value: string | null) => void;
	onAddOption: (option: SelectOption) => void;
	addOptionPlaceholder?: string;
}

export interface AdditionalSelectCellProps extends Omit<AdditionalSelectProps, "label"> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	row: Record<string, unknown>;
	column: string;
}

export interface AddOptionInputProps {
	onSubmit: (option: SelectOption) => void;
	existingOptions: SelectOption[];
	placeholder?: string;
	onCancel: () => void;
}
