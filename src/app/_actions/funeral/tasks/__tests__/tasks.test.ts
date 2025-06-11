/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createTask } from "../createTask";
import { listTasks } from "../listTasks";
import { getTask } from "../getTask";
import { updateTask } from "../updateTask";
import { deleteTask } from "../deleteTask";

vi.mock("@/lib/supabase/server", () => ({
	createClient: vi.fn(),
}));

describe("funeral tasks server actions", () => {
	// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
	let supabaseMock: any;
	const fakeTask = {
		id: "uuid",
		organization_id: "org",
		case_id: "case123",
		assigned_to: "user123",
		due_date: "2023-01-02",
		status: "pending",
	};

	beforeEach(() => {
		supabaseMock = {
			schema: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			single: vi.fn(),
		};
		// biome-ignore lint/suspicious/noExplicitAny: using any for supabase mock
		(createClient as any).mockResolvedValue(supabaseMock);
	});

	it("createTask returns created task", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTask, error: null });
		const result = await createTask({
			organizationId: "org",
			caseId: "case123",
			assignedTo: "user123",
			dueDate: "2023-01-02",
			status: "pending",
		});
		expect(result).toEqual(fakeTask);
	});

	it("createTask throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(
			createTask({
				organizationId: "org",
				caseId: "case123",
				assignedTo: "user123",
			}),
		).rejects.toThrow("fail");
	});

	it("listTasks returns array", async () => {
		supabaseMock.select.mockResolvedValue({ data: [fakeTask], error: null });
		const result = await listTasks();
		expect(result).toEqual([fakeTask]);
	});

	it("listTasks throws on error", async () => {
		supabaseMock.select.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(listTasks()).rejects.toThrow("fail");
	});

	it("getTask returns task", async () => {
		supabaseMock.single.mockResolvedValue({ data: fakeTask, error: null });
		const result = await getTask("uuid");
		expect(result).toEqual(fakeTask);
	});

	it("getTask throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(getTask("uuid")).rejects.toThrow("fail");
	});

	it("updateTask returns updated task", async () => {
		supabaseMock.select.mockReturnThis();
		supabaseMock.single.mockResolvedValue({ data: fakeTask, error: null });
		const result = await updateTask({ id: "uuid", status: "completed" });
		expect(result).toEqual(fakeTask);
	});

	it("updateTask throws on error", async () => {
		supabaseMock.single.mockResolvedValue({ data: null, error: new Error("fail") });
		await expect(updateTask({ id: "uuid", status: "completed" })).rejects.toThrow("fail");
	});

	it("deleteTask returns true", async () => {
		supabaseMock.eq.mockResolvedValue({ error: null });
		const result = await deleteTask("uuid");
		expect(result).toBe(true);
	});

	it("deleteTask throws on error", async () => {
		supabaseMock.eq.mockResolvedValue({ error: new Error("fail") });
		await expect(deleteTask("uuid")).rejects.toThrow("fail");
	});
});
