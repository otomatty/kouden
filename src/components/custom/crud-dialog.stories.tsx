import type { Meta, StoryObj } from "@storybook/react";
import { CrudDialog } from "./crud-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const meta = {
	title: "Components/CrudDialog",
	component: CrudDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof CrudDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleForm = ({ close }: { close: () => void }) => (
	<div className="space-y-4">
		<div className="space-y-2">
			<Label htmlFor="name">名前</Label>
			<Input id="name" placeholder="名前を入力" />
		</div>
		<div className="space-y-2">
			<Label htmlFor="email">メールアドレス</Label>
			<Input id="email" type="email" placeholder="メールアドレスを入力" />
		</div>
		<div className="flex justify-end space-x-2">
			<Button variant="outline" onClick={close}>
				キャンセル
			</Button>
			<Button
				onClick={() => {
					console.log("保存");
					close();
				}}
			>
				保存
			</Button>
		</div>
	</div>
);

export const Create: Story = {
	args: {
		title: "新規作成",
		variant: "create",
		createButtonLabel: "新規登録",
		children: SampleForm,
	},
};

export const Edit: Story = {
	args: {
		title: "編集",
		variant: "edit",
		editButtonLabel: "編集",
		children: SampleForm,
	},
};

export const CustomStyles: Story = {
	args: {
		title: "カスタムスタイル",
		variant: "create",
		buttonClassName: "bg-blue-500 hover:bg-blue-600 text-white",
		contentClassName: "max-w-lg",
		children: SampleForm,
	},
};

export const WithCallback: Story = {
	args: {
		title: "コールバック付き",
		variant: "create",
		children: SampleForm,
		onSuccess: (data) => {
			console.log("Success:", data);
		},
	},
};
