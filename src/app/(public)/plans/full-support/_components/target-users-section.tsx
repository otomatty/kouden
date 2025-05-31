import { HelpCircle, Users, ListChecks, ShieldCheck } from "lucide-react";

const FullSupportBenefitItem = ({
	icon: Icon,
	title,
	children,
}: {
	icon: React.ElementType;
	title: string;
	children: React.ReactNode;
}) => (
	<div className="flex items-start space-x-3">
		<Icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
		<div>
			<h3 className="font-semibold">{title}</h3>
			<p className="text-sm text-muted-foreground">{children}</p>
		</div>
	</div>
);

export default function TargetUsersSection() {
	return (
		<section className="mb-12 md:mb-16 bg-muted p-6 md:p-8 rounded-lg">
			<h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
				こんな方におすすめです
			</h2>
			<div className="grid md:grid-cols-2 gap-6">
				<FullSupportBenefitItem icon={Users} title="ITリテラシーはあるが、時間がない方">
					普段PCは使うけれど、葬儀後の多忙な時期に新しいアプリの操作を覚える時間や精神的余裕がない。
				</FullSupportBenefitItem>
				<FullSupportBenefitItem icon={ShieldCheck} title="確実性を重視する方">
					間違いなく確実に香典管理を終えたい。専門家のサポートで安心して作業を進めたい。
				</FullSupportBenefitItem>
				<FullSupportBenefitItem icon={HelpCircle} title="新しいツールが少し苦手な方">
					新しいツールの導入や複雑な設定は得意ではない、あるいは時間が取れないと感じている。
				</FullSupportBenefitItem>
				<FullSupportBenefitItem icon={ListChecks} title="効率と安心の両方を求める方">
					AIによる効率化と、人の手による安心のサポートで、時間的・精神的負担を最大限に軽減したい。
				</FullSupportBenefitItem>
			</div>
		</section>
	);
}
