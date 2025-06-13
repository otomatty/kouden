import React from "react";

interface OrgStatus {
	id: string;
	name: string;
	status: string;
	typeName: string;
	timeAgo: string;
}

interface StatusCardListProps {
	data: OrgStatus[];
}

// Map English status to Japanese labels
const statusLabels: Record<string, string> = {
	pending: "承認待ち",
	active: "有効",
	approved: "承認済み",
	rejected: "却下",
};

export default function StatusCardList({ data }: StatusCardListProps) {
	if (data.length === 0) {
		return <p className="text-center text-gray-500">申請がありません</p>;
	}

	return (
		<div className="flex flex-col space-y-4">
			{data.map(({ id, name, status, typeName, timeAgo }) => {
				const label = statusLabels[status] ?? status;
				return (
					<div
						key={id}
						className="w-full bg-white border rounded-lg p-6 shadow-sm flex justify-between items-center"
					>
						<div className="flex flex-col gap-2">
							<p className="text-xl font-semibold">{name}</p>
							<p className="text-sm text-muted-foreground">タイプ: {typeName}</p>
							<p className="text-sm text-muted-foreground">ID: {id}</p>
							<p className="text-sm text-muted-foreground">申請: {timeAgo}</p>
						</div>
						<div>
							<span
								className={`px-3 py-1 rounded-full text-sm ${
									status === "approved" || status === "active"
										? "bg-green-100 text-green-800"
										: status === "pending"
											? "bg-yellow-100 text-yellow-800"
											: status === "rejected"
												? "bg-red-100 text-red-800"
												: "bg-gray-100 text-gray-800"
								}`}
							>
								{label}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
