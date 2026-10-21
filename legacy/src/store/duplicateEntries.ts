import { atom } from "jotai";
import type { DuplicateEntriesResult } from "@/app/_actions/validateDuplicateEntries";

// Atom to store duplicate entries validation results
export const duplicateEntriesAtom = atom<DuplicateEntriesResult[] | null>(null);
