import { Header } from "@/app/(public)/_components/header";
import { LoginForm } from "./_components/login-form";
import pkg from "../../../../package.json";

const version = pkg.version;

export default function LoginPage() {
	return (
		<>
			<Header version={version} />
			<main className="min-h-screen pt-16">
				<section className="py-24">
					<div className="container px-4 md:px-6 mx-auto">
						<div className="flex flex-col items-center space-y-8 text-center">
							<div className="space-y-2">
								<h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
									ログイン
								</h1>
								<p className="text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									香典帳アプリへようこそ
								</p>
							</div>
							<div className="w-full max-w-sm space-y-4">
								<LoginForm />
								<p className="text-sm text-gray-500 dark:text-gray-400">
									※ ご利用にはGoogleアカウントが必要です
									<br />
									アカウントをお持ちでない方は
									<a
										href="https://accounts.google.com/signup"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline"
									>
										こちら
									</a>
									から作成できます
								</p>
							</div>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
