import { requireAdmin } from "@/app/_actions/admin/permissions";
import { CSRFProvider } from "@/components/providers/csrf-provider";
import { Container } from "@/components/ui/container";
import { AdminHeader } from "./_components/admin-header";

interface AdminLayoutProps {
	children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
	const { user } = await requireAdmin();

	return (
		<CSRFProvider>
			<div className="min-h-screen bg-gray-50">
				<AdminHeader user={user} />
				<Container className="mx-auto px-6 py-8">{children}</Container>
			</div>
		</CSRFProvider>
	);
}
