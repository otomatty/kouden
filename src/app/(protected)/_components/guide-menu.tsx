import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, HelpCircle, PlayCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { tourStateAtom } from "@/components/custom/TourGuide/tour-store";

export function GuideMenu() {
	const router = useRouter();
	const pathname = usePathname();
	const [, setTourState] = useAtom(tourStateAtom);

	const handleStartTour = () => {
		setTourState({
			isActive: true,
			currentPage: pathname,
		});
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon">
								<HelpCircle className="h-5 w-5" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80" align="end">
							<div className="space-y-4">
								<h4 className="font-medium leading-none mb-2">ガイド</h4>
								<div className="space-y-2">
									<button
										type="button"
										onClick={handleStartTour}
										className="w-full flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors"
									>
										<div className="h-10 w-10 flex items-center justify-center rounded-md bg-primary/10">
											<PlayCircle className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1 text-left">
											<h5 className="font-medium">ツアーを開始</h5>
											<p className="text-sm text-muted-foreground">
												現在のページの機能をステップバイステップで説明します
											</p>
										</div>
									</button>
									<button
										type="button"
										onClick={() => router.push("/guide/docs")}
										className="w-full flex items-center space-x-2 hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors"
									>
										<div className="h-10 w-10 flex items-center justify-center rounded-md bg-primary/10">
											<BookOpen className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1 text-left">
											<h5 className="font-medium">使い方ガイド</h5>
											<p className="text-sm text-muted-foreground">
												詳細な機能説明とよくある質問を確認できます
											</p>
										</div>
									</button>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</TooltipTrigger>
				<TooltipContent>
					<p>ガイド・ヘルプ</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
