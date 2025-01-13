export const formatPostalCode = (postalCode: string | null): string => {
	if (!postalCode) return "";
	// 数字以外を除去
	const numbers = postalCode.replace(/[^\d]/g, "");
	if (numbers.length !== 7) return postalCode;

	// 〒XXX-XXXX の形式に整形
	return `〒${numbers.slice(0, 3)}-${numbers.slice(3)}`;
};

export const formatPhoneNumber = (phoneNumber: string | null): string => {
	if (!phoneNumber) return "";
	// 数字以外を除去
	const numbers = phoneNumber.replace(/[^\d]/g, "");

	// 桁数に応じてフォーマット
	if (numbers.length === 11) {
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
	}
	if (numbers.length === 10) {
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
	}

	return phoneNumber;
};

export const formatInputPostalCode = (value: string): string => {
	const numbers = value.replace(/[^\d]/g, "");
	if (numbers.length > 7) return value;
	if (numbers.length > 3) {
		return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
	}
	return numbers;
};

export const formatInputPhoneNumber = (value: string): string => {
	const numbers = value.replace(/[^\d]/g, "");
	if (numbers.length > 11) return value;

	if (numbers.length > 7) {
		return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
	}
	if (numbers.length > 3) {
		return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
	}
	return numbers;
};

export const formatInputCurrency = (value: number): string => {
	return value.toLocaleString();
};

export const formatCurrency = (amount: number): string => {
	return new Intl.NumberFormat("ja-JP", {
		style: "currency",
		currency: "JPY",
	}).format(amount);
};

interface AddressCache {
	address: string;
	timestamp: number;
}

// キャッシュの有効期限（24時間）
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// キャッシュストレージの取得
const getAddressCache = (): Record<string, AddressCache> => {
	try {
		const cache = localStorage.getItem("postalCodeCache");
		return cache ? JSON.parse(cache) : {};
	} catch {
		return {};
	}
};

// キャッシュの保存
const setAddressCache = (cache: Record<string, AddressCache>) => {
	try {
		localStorage.setItem("postalCodeCache", JSON.stringify(cache));
	} catch (error) {
		console.error("キャッシュの保存に失敗しました:", error);
	}
};

// キャッシュのクリーンアップ（期限切れのエントリを削除）
const cleanupCache = (
	cache: Record<string, AddressCache>,
): Record<string, AddressCache> => {
	const now = Date.now();
	const cleaned = Object.entries(cache).reduce<Record<string, AddressCache>>(
		(acc, [key, value]) => {
			if (now - value.timestamp < CACHE_EXPIRY) {
				acc[key] = value;
			}
			return acc;
		},
		{},
	);
	setAddressCache(cleaned);
	return cleaned;
};

export const searchAddress = async (
	postalCode: string,
): Promise<{ address: string } | null> => {
	try {
		const numbers = postalCode.replace(/[^\d]/g, "");
		if (numbers.length !== 7) return null;

		// キャッシュの確認
		const cache = getAddressCache();
		const cleanedCache = cleanupCache(cache);
		const cachedResult = cleanedCache[numbers];

		if (cachedResult) {
			return { address: cachedResult.address };
		}

		// APIリクエスト
		const response = await fetch(
			`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${numbers}`,
		);
		const data = await response.json();

		if (data.results?.[0]) {
			const { address1, address2, address3 } = data.results[0];
			const address = `${address1}${address2}${address3}`;

			// 結果をキャッシュに保存
			cleanedCache[numbers] = {
				address,
				timestamp: Date.now(),
			};
			setAddressCache(cleanedCache);

			return { address };
		}
		return null;
	} catch (error) {
		console.error("郵便番号検索エラー:", error);
		return null;
	}
};
