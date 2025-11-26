import {
	assignTicket,
	getTickets,
	updateTicketPriority,
	updateTicketStatus,
} from "@/app/_actions/admin/tickets";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { TicketFilters } from "./_components/ticket-filters";
import { TicketsTable } from "./_components/tickets-table";

async function TicketsContent() {
	const tickets = await getTickets();

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">サポートチケット</h1>
			</div>
			<TicketFilters />
			<TicketsTable
				tickets={tickets}
				updateTicketStatus={updateTicketStatus}
				updateTicketPriority={updateTicketPriority}
				assignTicket={assignTicket}
			/>
		</div>
	);
}

function TicketsSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-48" />
			</div>
			<Skeleton className="h-20 w-full" />
			<Skeleton className="h-[400px] w-full" />
		</div>
	);
}

export default function TicketsPage() {
	return (
		<Suspense fallback={<TicketsSkeleton />}>
			<TicketsContent />
		</Suspense>
	);
}
