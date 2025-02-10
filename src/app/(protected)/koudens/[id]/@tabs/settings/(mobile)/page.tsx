import React from "react";
import { SettingsList } from "./_components/settings-list";
import { SettingsIcon, UsersIcon, HeartIcon, TruckIcon, GiftIcon } from "lucide-react";

// TODO: モバイル版設定一覧ページの実装
export default function SettingsMobilePage() {
	const settingsItems = [
		{
			href: "settings/general",
			label: "一般設定",
			icon: <SettingsIcon />,
			description: "香典帳の基本設定を行います",
		},
		{
			href: "settings/members",
			label: "メンバー設定",
			icon: <UsersIcon />,
			description: "メンバーの管理を行います",
		},
		{
			href: "settings/relationships",
			label: "関係性",
			icon: <HeartIcon />,
			description: "参列者との関係性を管理します",
		},
		{
			href: "settings/delivery-methods",
			label: "配送方法",
			icon: <TruckIcon />,
			description: "返礼品の配送方法を設定します",
		},
		{
			href: "settings/return-items",
			label: "返礼品",
			icon: <GiftIcon />,
			description: "返礼品の管理を行います",
		},
	];

	return (
		<div className="bg-white">
			<SettingsList items={settingsItems} />
		</div>
	);
}
