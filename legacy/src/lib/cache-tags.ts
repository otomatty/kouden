/**
 * Cache tag helpers for fine-grained cache invalidation.
 *
 * Use with `revalidateTag` (from `next/cache`) and `unstable_cache` to
 * invalidate only the data that actually changed, rather than re-rendering
 * an entire route subtree with `revalidatePath`.
 */
export const cacheTags = {
	kouden: (koudenId: string) => `kouden:${koudenId}` as const,
	entries: (koudenId: string) => `kouden:${koudenId}:entries` as const,
	offerings: (koudenId: string) => `kouden:${koudenId}:offerings` as const,
	telegrams: (koudenId: string) => `kouden:${koudenId}:telegrams` as const,
	relationships: (koudenId: string) => `kouden:${koudenId}:relationships` as const,
	statistics: (koudenId: string) => `kouden:${koudenId}:statistics` as const,
	returnRecords: (koudenId: string) => `kouden:${koudenId}:return-records` as const,
} as const;
