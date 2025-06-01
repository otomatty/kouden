import { Header } from "@/app/(public)/_components/header";
import pkg from "../../../../package.json";

const version = pkg.version;

export default async function SentPage({
	searchParams,
}: { searchParams: Promise<{ email?: string }> }) {
	const { email = "" } = await searchParams;

	return (
		<>
			<Header version={version} />
			<main className="min-h-screen pt-16">
				<section className="py-24">
					<div className="container px-4 md:px-6 mx-auto">
						<div className="flex flex-col items-center space-y-8 text-center">
							<h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
								メールを送信しました
							</h1>
							<p className="text-gray-500">
								<span className="font-medium">{email}</span> にログインリンクを送りました。
							</p>
							<p className="text-gray-500">
								メールボックスを確認して、リンクをクリックしてください。
							</p>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
