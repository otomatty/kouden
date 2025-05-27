import { Header } from "./_components/header";
import { Footer } from "./_components/footer";
import type { Metadata } from "next";
import pkg from "../../../package.json";

const version = pkg.version;

export const metadata: Metadata = {
	title: "香典帳 | 香典・供物の記録と返礼品の管理を簡単に",
	description:
		"香典帳は、香典や供物の記録、返礼品の管理をサポートするアプリです。家族との情報共有や、返礼品の相場確認、進捗管理など、大切な方への感謝の気持ちを形にするお手伝いをします。",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header version={version} />
			<main className="mt-16 min-h-screen">{children}</main>
			<Footer />
		</>
	);
}
