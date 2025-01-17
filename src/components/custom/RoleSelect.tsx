import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface RoleSelectProps {
	koudenId: string;
	value: string;
	onValueChange: (value: string) => void;
}

interface Role {
	id: string;
	name: string;
}

export function RoleSelect({
	koudenId,
	value,
	onValueChange,
}: RoleSelectProps) {
	const [roles, setRoles] = useState<Role[]>([]);
	const supabase = createClient();

	useEffect(() => {
		const fetchRoles = async () => {
			const { data, error } = await supabase
				.from("kouden_roles")
				.select("id, name")
				.eq("kouden_id", koudenId)
				.order("created_at", { ascending: true });

			if (error) {
				console.error("Error fetching roles:", error);
				return;
			}

			setRoles(data);
		};

		fetchRoles();
	}, [koudenId, supabase]);

	return (
		<div className="grid w-full items-center gap-1.5">
			<Label htmlFor="role">ロール</Label>
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger id="role">
					<SelectValue placeholder="ロールを選択" />
				</SelectTrigger>
				<SelectContent>
					{roles.map((role) => (
						<SelectItem key={role.id} value={role.id}>
							{role.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
