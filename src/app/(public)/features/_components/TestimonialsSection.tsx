import React from "react";
import type { Testimonial } from "@/types/testimonials";
import { SectionTitle } from "@/components/ui/section-title";
import { TestimonialCard } from "./TestimonialCard";

/**
 * TestimonialsSection renders the 利用者の声 section with horizontal scrolling testimonials.
 */
export function TestimonialsSection({
	testimonials,
}: {
	testimonials: Testimonial[];
}) {
	return (
		<section>
			<SectionTitle title="利用者の声" className="mb-8" />
			<div className="flex space-x-6 overflow-x-auto pb-4 px-48 scrollbar-hide">
				{testimonials.map((t) => (
					<TestimonialCard
						key={t.id}
						rating={t.rating}
						comment={t.comment}
						name={t.name}
						ageGroup={t.ageGroup}
					/>
				))}
			</div>
		</section>
	);
}
