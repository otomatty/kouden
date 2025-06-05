/**
 * Calculates the total fee for full support plan based on expected entry count.
 * @param expectedCount - Number of expected entries
 * @param basePrice - Base plan price for up to baseLimit entries
 * @param baseLimit - Number of entries covered by basePrice (default: 100)
 * @param addFeePerBlock - Additional fee per block of 50 entries beyond baseLimit (default: 4000)
 * @returns Calculated total fee in yen
 */
export function calcSupportFee(
	expectedCount: number,
	basePrice: number,
	baseLimit = 100,
	addFeePerBlock = 4000,
): number {
	if (expectedCount <= baseLimit) {
		return basePrice;
	}
	const extraCount = expectedCount - baseLimit;
	const blocks = Math.ceil(extraCount / 50);
	return basePrice + addFeePerBlock * blocks;
}
