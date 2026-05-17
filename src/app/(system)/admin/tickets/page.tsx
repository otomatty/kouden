import { Suspense } from "react";
import { TicketsTable } from "./_components/tickets-table";
import { TicketFilters } from "./_components/ticket-filters";
import {
	getTickets,
	updateTicketStatus,
	updateTicketPriority,
	assignTicket,
} from "@/app/_actions/admin/tickets";
import type { Ticket } from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";

async function handleUpdateTicketStatus(id: string, status: Ticket["status"]): Promise<void> {
	"use server";
	const result = await updateTicketStatus(id, status);
	if (!result.ok) {
		throw new Error(result.error.message);
	}
}

async function handleUpdateTicketPriority(
	id: string,
	priority: Ticket["priority"],
): Promise<void> {
	"use server";
	const result = await updateTicketPriority(id, priority);
	if (!result.ok) {
		throw new Error(result.error.message);
	}
}

async function handleAssignTicket(id: string, adminId: string | null): Promise<void> {
	"use server";
	const result = await assignTicket(id, adminId);
	if (!result.ok) {
		throw new Error(result.error.message);
	}
}

async function TicketsContent() {
	const ticketsResult = await getTickets();
	if (!ticketsResult.ok) {
		throw new Error(ticketsResult.error.message);
	}
	const tickets = ticketsResult.data;

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">サポートチケット</h1>
			</div>
			<TicketFilters />
			<TicketsTable
				tickets={tickets}
				updateTicketStatus={handleUpdateTicketStatus}
				updateTicketPriority={handleUpdateTicketPriority}
				assignTicket={handleAssignTicket}
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
