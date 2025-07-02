import { PageHero } from "@/app/(public)/_components/page-hero";
import ContactForm from "@/components/contact/contact-form";

export default function ContactPage() {
	return (
		<>
			<PageHero
				title="お問い合わせ"
				subtitle="ご質問・ご要望はこちらからどうぞ。"
				className="bg-background"
			/>
			<div className="md:container md:max-w-3xl md:mx-auto my-8 px-0 md:px-4">
				<ContactForm />
			</div>
		</>
	);
}
