import type { Relationship } from "@/types/relationships";

export interface RelationshipsViewProps {
	koudenId: string;
	relationships: Relationship[];
	onAdd: () => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onToggle: (id: string, isActive: boolean) => void;
}

export interface RelationshipsListProps {
	relationships: Relationship[];
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onToggle: (id: string, isActive: boolean) => void;
}
