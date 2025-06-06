import { SettingsMenu } from "./_components/settings-menu";

interface DefaultSettingsMenuPageProps {
	params: Promise<{ id: string }>;
}

export default async function DefaultSettingsMenuPage({ params }: DefaultSettingsMenuPageProps) {
	const { id: koudenId } = await params;

	return <SettingsMenu koudenId={koudenId} />;
}
