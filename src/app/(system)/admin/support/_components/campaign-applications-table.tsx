import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { CampaignApplicationsPagination } from "./campaign-applications-pagination";
import { getCampaignApplications } from "@/app/_actions/admin/campaign-applications";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Eye, Mail, User, Phone, Calendar, Monitor } from "lucide-react";

interface CampaignApplicationsTableProps {
	status?: string;
	page: number;
}

interface CampaignFormData {
	name?: string;
	email?: string;
	phone?: string;
	currentUsage?: string;
	videoTool?: string;
	selectedSlot?: {
		start: string;
		end: string;
	};
}

const statusConfig = {
	submitted: { label: "送信済み", variant: "destructive" as const },
	confirmed: { label: "確定", variant: "default" as const },
	completed: { label: "実施完了", variant: "secondary" as const },
	cancelled: { label: "キャンセル", variant: "outline" as const },
};

const usageConfig = {
	new: "初めて利用する",
	free: "無料プランを利用中",
	basic: "ベーシックプランを利用中",
	premium: "プレミアムプランを利用中",
};

const videoToolConfig = {
	googlemeet: "Google Meet",
	zoom: "Zoom",
	teams: "Microsoft Teams",
};

function formatSlotTime(slot: { start: string; end: string }) {
	const startDate = new Date(slot.start);
	const endDate = new Date(slot.end);
	return `${startDate.getMonth() + 1}/${startDate.getDate()} ${startDate.getHours()}:00-${endDate.getHours()}:00`;
}

export async function CampaignApplicationsTable({ status, page }: CampaignApplicationsTableProps) {
	const result = await getCampaignApplications({
		status,
		page,
		limit: 20,
	});

	if (result.data.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-500">キャンペーン申し込みが見つかりませんでした</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>申込者情報</TableHead>
						<TableHead>希望面談日時</TableHead>
						<TableHead>現在の利用状況</TableHead>
						<TableHead>ステータス</TableHead>
						<TableHead>申込日時</TableHead>
						<TableHead>操作</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{result.data.map((application) => {
						const formData = application.form_data as CampaignFormData | null;

						return (
							<TableRow key={application.id}>
								<TableCell className="font-mono text-xs">{application.id.slice(0, 8)}...</TableCell>
								<TableCell>
									{formData ? (
										<div className="space-y-1">
											<div className="flex items-center gap-1 text-sm">
												<User className="h-3 w-3" />
												{formData.name || "未入力"}
											</div>
											<div className="flex items-center gap-1 text-sm text-gray-600">
												<Mail className="h-3 w-3" />
												{formData.email || "未入力"}
											</div>
											{formData.phone && (
												<div className="flex items-center gap-1 text-xs text-gray-500">
													<Phone className="h-3 w-3" />
													{formData.phone}
												</div>
											)}
										</div>
									) : (
										<span className="text-gray-400">データなし</span>
									)}
								</TableCell>
								<TableCell>
									{formData?.selectedSlot ? (
										<div className="space-y-1">
											<div className="flex items-center gap-1 text-sm">
												<Calendar className="h-3 w-3" />
												{formatSlotTime(formData.selectedSlot)}
											</div>
											<div className="flex items-center gap-1 text-xs text-gray-500">
												<Monitor className="h-3 w-3" />
												{videoToolConfig[formData.videoTool as keyof typeof videoToolConfig] ||
													formData.videoTool}
											</div>
										</div>
									) : (
										<span className="text-gray-400">未選択</span>
									)}
								</TableCell>
								<TableCell>
									{formData ? (
										<Badge variant="outline">
											{usageConfig[formData.currentUsage as keyof typeof usageConfig] ||
												formData.currentUsage ||
												"未入力"}
										</Badge>
									) : (
										<span className="text-gray-400">データなし</span>
									)}
								</TableCell>
								<TableCell>
									<Badge
										variant={
											statusConfig[application.status as keyof typeof statusConfig]?.variant ||
											"default"
										}
									>
										{statusConfig[application.status as keyof typeof statusConfig]?.label ||
											application.status}
									</Badge>
								</TableCell>
								<TableCell className="text-sm text-gray-600">
									{application.created_at &&
										formatDistanceToNow(new Date(application.created_at), {
											addSuffix: true,
											locale: ja,
										})}
								</TableCell>
								<TableCell>
									<Button asChild variant="outline" size="sm">
										<Link href={`/admin/support/campaign/${application.id}`}>
											<Eye className="h-4 w-4 mr-1" />
											詳細
										</Link>
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<CampaignApplicationsPagination
				currentPage={result.page}
				totalPages={result.totalPages}
				totalCount={result.count}
			/>
		</div>
	);
}
