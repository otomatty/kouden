import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./_components/login-form";

export default async function LoginPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (user) {
		redirect("/koudens");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<h1 className="mt-6 text-center text-3xl font-bold tracking-tight">
					香典帳アプリ
				</h1>
				<h2 className="mt-6 text-center text-2xl">ログイン</h2>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
					<LoginForm />
				</div>
			</div>
		</div>
	);
}
