import { useState, useEffect } from "react";

interface ScrollPosition {
	scrollY: number;
	isScrollingUp: boolean;
}

export function useScrollPosition(): ScrollPosition {
	const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
		scrollY: 0,
		isScrollingUp: false,
	});

	useEffect(() => {
		let lastScrollY = window.scrollY;

		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			const isScrollingUp = currentScrollY < lastScrollY;

			setScrollPosition({
				scrollY: currentScrollY,
				isScrollingUp,
			});

			lastScrollY = currentScrollY;
		};

		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return scrollPosition;
}
