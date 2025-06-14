import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
	currentStep: number;
	totalSteps: number;
	steps: Array<{
		title: string;
		description: string;
	}>;
}

export default function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
	return (
		<div className="w-full">
			{/* デスクトップ版 */}
			<Card className="hidden md:flex items-center justify-between mx-auto bg-background">
				{steps.map((step, index) => {
					const stepNumber = index + 1;
					const isCompleted = stepNumber < currentStep;
					const isCurrent = stepNumber === currentStep;
					const isUpcoming = stepNumber > currentStep;

					return (
						<div key={stepNumber} className="flex items-center justify-center flex-1 p-4">
							{/* Step Circle */}
							<div className="flex flex-col items-center">
								<div
									className={cn(
										"w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
										{
											"bg-primary text-primary-foreground": isCompleted,
											"bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2":
												isCurrent,
											"bg-muted text-muted-foreground": isUpcoming,
										},
									)}
								>
									{isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
								</div>

								{/* Step Info */}
								<div className="mt-2 text-center">
									<div
										className={cn("text-sm font-medium", {
											"text-primary": isCurrent,
											"text-foreground": isCompleted,
											"text-muted-foreground": isUpcoming,
										})}
									>
										{step.title}
									</div>
									<div
										className={cn("text-xs mt-1 max-w-[120px]", {
											"text-muted-foreground": isCurrent || isCompleted,
											"text-muted-foreground/60": isUpcoming,
										})}
									>
										{step.description}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</Card>

			{/* モバイル版 */}
			<div className="md:hidden">
				<div className="flex items-center justify-center mb-4">
					<div className="text-sm text-muted-foreground">
						ステップ {currentStep} / {totalSteps}
					</div>
				</div>
				<div className="flex items-center justify-center space-x-2 mb-4">
					{steps.map((_, index) => {
						const stepNumber = index + 1;
						const isCompleted = stepNumber < currentStep;
						const isCurrent = stepNumber === currentStep;
						const isUpcoming = stepNumber > currentStep;

						return (
							<div
								key={stepNumber}
								className={cn("w-3 h-3 rounded-full transition-colors", {
									"bg-primary": isCompleted || isCurrent,
									"bg-muted": isUpcoming,
								})}
							/>
						);
					})}
				</div>
				<div className="text-center">
					<div className="text-lg font-medium text-foreground">{steps[currentStep - 1]?.title}</div>
					<div className="text-sm text-muted-foreground mt-1">
						{steps[currentStep - 1]?.description}
					</div>
				</div>
			</div>
		</div>
	);
}
