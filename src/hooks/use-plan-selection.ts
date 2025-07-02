import { useState, useMemo, useCallback } from "react";
import { calcSupportFee } from "@/utils/calcSupportFee";
import { validatePlanSelection } from "@/schemas/plan-selector";
import type {
	Plan,
	PlanSelectorMode,
	PlanDisplayData,
	UsePlanSelectionReturn,
} from "@/types/plan-selector";

interface UsePlanSelectionProps {
	/** 選択可能なプラン一覧 */
	plans: Plan[];
	/** 初期選択プラン */
	initialPlan?: string;
	/** 初期予想件数 */
	initialExpectedCount?: number;
	/** 現在のプラン（アップグレード時） */
	currentPlan?: Plan;
	/** プラン選択のモード */
	mode: PlanSelectorMode;
}

/**
 * プラン選択の状態管理とロジックを担当するカスタムhook
 */
export function usePlanSelection({
	plans,
	initialPlan,
	initialExpectedCount = 0,
	currentPlan,
	mode,
}: UsePlanSelectionProps): UsePlanSelectionReturn {
	const [selectedPlanCode, setSelectedPlanCode] = useState<string>(
		initialPlan || plans[0]?.code || "",
	);
	const [expectedCount, setExpectedCount] = useState<number>(initialExpectedCount);

	// 選択されたプランオブジェクト
	const selectedPlan = useMemo(
		() => plans.find((plan) => plan.code === selectedPlanCode),
		[plans, selectedPlanCode],
	);

	// 表示用プランデータの計算
	const planDisplayData = useMemo<PlanDisplayData[]>(() => {
		return plans.map((plan) => {
			const isCurrent = currentPlan?.code === plan.code;
			const isUpgradable = mode === "upgrade" ? plan.price > (currentPlan?.price || 0) : true;

			// 表示価格の計算
			let displayPrice = plan.price;
			if (plan.code === "premium_full_support") {
				if (mode === "create" || (mode === "upgrade" && isUpgradable)) {
					displayPrice = calcSupportFee(expectedCount, plan.price);
				}
			}

			return {
				...plan,
				displayPrice,
				isCurrent,
				isUpgradable,
				isSelectable: mode === "create" ? true : isUpgradable && !isCurrent,
			};
		});
	}, [plans, expectedCount, currentPlan, mode]);

	// バリデーション
	const validationResult = useMemo(() => {
		return validatePlanSelection({
			planCode: selectedPlanCode,
			expectedCount: selectedPlanCode === "premium_full_support" ? expectedCount : undefined,
		});
	}, [selectedPlanCode, expectedCount]);

	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {};

		if (!validationResult.success) {
			for (const issue of validationResult.error.issues) {
				const path = issue.path.join(".");
				errors[path] = issue.message;
			}
		}

		return errors;
	}, [validationResult]);

	// プラン変更ハンドラ
	const handlePlanChange = useCallback((planCode: string) => {
		setSelectedPlanCode(planCode);
	}, []);

	// 予想件数変更ハンドラ
	const handleExpectedCountChange = useCallback((count: number) => {
		setExpectedCount(count);
	}, []);

	return {
		selectedPlan,
		expectedCount,
		planDisplayData,
		handlePlanChange,
		handleExpectedCountChange,
		validationErrors,
		isValid: validationResult.success,
	};
}
