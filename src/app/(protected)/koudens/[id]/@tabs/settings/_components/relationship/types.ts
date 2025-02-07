import type { Relationship } from "../index";

export interface RelationshipSectionProps {
	koudenId: string;
	relationships: Relationship[];
	onAdd: () => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onToggle: (id: string, isActive: boolean) => void;
}

export interface RelationshipListProps {
	relationships: Relationship[];
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
	onToggle: (id: string, isActive: boolean) => void;
}
