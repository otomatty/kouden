export const formatInputCurrency = (value: number | undefined): string => {
	if (value === undefined) {
		return "";
	}
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
	}).format(value);
};

export const formatCurrency = (value: number | undefined): string => {
	if (value === undefined) {
		return "";
	}
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
	}).format(value);
};
