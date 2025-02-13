import { Zen_Old_Mincho, Noto_Sans_JP } from "next/font/google";

export const zenOldMincho = Zen_Old_Mincho({
	subsets: ["latin"],
	preload: true,
	weight: ["400", "500", "600", "700", "900"],
});

export const notoSansJP = Noto_Sans_JP({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "900"],
	preload: true,
});
