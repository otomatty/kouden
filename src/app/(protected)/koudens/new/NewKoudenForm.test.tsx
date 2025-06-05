import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewKoudenForm from "./NewKoudenForm";
import * as createModule from "@/app/_actions/koudens/create";
import * as purchaseModule from "@/app/_actions/purchaseKouden";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import "@testing-library/jest-dom";

// モックの設定
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

type Plan = Database["public"]["Tables"]["plans"]["Row"];

describe("NewKoudenForm", () => {
	const plans: Plan[] = [
		{
			id: "1",
			code: "free",
			name: "Free",
			description: "Free plan",
			features: ["Free plan"],
			price: 0,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
		},
		{
			id: "2",
			code: "premium_full_support",
			name: "Premium",
			description: "Premium plan",
			features: ["Premium plan"],
			price: 1000,
			created_at: "2020-01-01T00:00:00Z",
			updated_at: "2020-01-01T00:00:00Z",
		},
	];
	const userId = "user-1";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders plans and default selection", () => {
		render(<NewKoudenForm plans={plans} userId={userId} />);
		// プランが表示され、最初のプランが選択されている
		const freeInput = screen.getByDisplayValue("free") as HTMLInputElement;
		const premiumInput = screen.getByDisplayValue("premium_full_support") as HTMLInputElement;
		expect(freeInput).toBeInTheDocument();
		expect(premiumInput).toBeInTheDocument();
		expect(freeInput.checked).toBe(true);
	});

	it("toggles expected count input for premium_full_support", () => {
		render(<NewKoudenForm plans={plans} userId={userId} />);
		expect(screen.queryByLabelText("予想件数")).toBeNull();
		const premiumInput = screen.getByDisplayValue("premium_full_support");
		fireEvent.click(premiumInput);
		expect(screen.getByLabelText("予想件数")).toBeInTheDocument();
	});

	it("submits free plan and navigates", async () => {
		vi.spyOn(createModule, "createKoudenWithPlan").mockResolvedValue({ koudenId: "123" });
		render(<NewKoudenForm plans={plans} userId={userId} />);
		fireEvent.click(screen.getByText("作成する"));
		await waitFor(() => {
			expect(createModule.createKoudenWithPlan).toHaveBeenCalledWith({
				userId,
				title: "",
				description: "",
				planCode: "free",
				expectedCount: undefined,
			});
		});
		expect(pushMock).toHaveBeenCalledWith("/koudens/123/entries");
	});

	it("submits paid plan and redirects to Stripe URL", async () => {
		vi.spyOn(purchaseModule, "purchaseKouden").mockResolvedValue({
			url: "http://example.com",
			sessionId: "sess",
		});
		// window.location.href のモック
		Object.defineProperty(window, "location", {
			writable: true,
			value: { href: "" },
		});

		render(<NewKoudenForm plans={plans} userId={userId} />);
		fireEvent.click(screen.getByDisplayValue("premium_full_support"));
		fireEvent.click(screen.getByText("購入に進む"));

		await waitFor(() => {
			expect(purchaseModule.purchaseKouden).toHaveBeenCalled();
			const args = (purchaseModule.purchaseKouden as unknown as jest.Mock).mock.calls[0][0];
			expect(args.planCode).toBe("premium_full_support");
		});
		expect(window.location.href).toBe("http://example.com");
	});
});
