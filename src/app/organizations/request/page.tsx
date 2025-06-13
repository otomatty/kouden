import OrganizationRequestForm from "./OrganizationRequestForm";
import Container from "@/components/ui/container";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RequestPage() {
	const supabase = await createClient();

	// Redirect to login if not authenticated
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		redirect(`/auth/login?redirectTo=${encodeURIComponent("/organizations/request")}`);
	}

	// Try to fetch organization types with proper error handling
	const { data: types, error: typesError } = await supabase
		.schema("common")
		.from("organization_types")
		.select("id, name");

	// If there's an error or no data, show error message
	if (typesError) {
		console.error("Failed to fetch organization types:", typesError);
		return (
			<Container className="py-8">
				<div className="max-w-md mx-auto text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
					<p className="text-gray-600 mb-4">組織種別の情報を取得できませんでした。</p>
					<p className="text-sm text-gray-500 mb-4">エラー詳細: {typesError.message}</p>
					<Link href="/organizations/status" className="text-blue-500 underline">
						戻る
					</Link>
				</div>
			</Container>
		);
	}

	if (!types || types.length === 0) {
		return (
			<Container className="py-8">
				<div className="max-w-md mx-auto text-center">
					<h1 className="text-2xl font-bold text-yellow-600 mb-4">データが見つかりません</h1>
					<p className="text-gray-600 mb-4">組織種別のデータが設定されていません。</p>
					<Link href="/organizations/status" className="text-blue-500 underline">
						戻る
					</Link>
				</div>
			</Container>
		);
	}

	return (
		<Container className="py-8">
			<OrganizationRequestForm types={types} />
			<div className="mt-6 text-center">
				<Link href="/organizations/status" className="text-blue-500 underline">
					現在申請中の組織を確認する
				</Link>
			</div>
		</Container>
	);
}
