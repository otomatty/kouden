import { z } from "zod";

export const PostStatusSchema = z.enum(["draft", "published"]);

export const PostSchema = z.object({
	id: z.string().uuid(),
	organization_id: z.string().uuid(),
	author_id: z.string().uuid(),
	title: z.string().min(1, "タイトルは必須です。"),
	content: z.string().nullable(),
	slug: z
		.string()
		.min(1, "スラッグは必須です。")
		.regex(/^[a-z0-9-]+$/, "スラッグは小文字の英数字とハイフンのみ使用できます。"),
	status: PostStatusSchema,
	published_at: z.string().datetime().nullable(),
	created_at: z.string().datetime(),
	updated_at: z.string().datetime(),
});

export const CreatePostSchema = PostSchema.pick({
	title: true,
	content: true,
	slug: true,
	status: true,
	organization_id: true,
}).extend({
	// content は任意入力にする
	content: z.string().optional(),
	// status は任意入力で、デフォルトは 'draft'
	status: PostStatusSchema.default("draft"),
	// 公開する場合、公開日をセットする
	published_at: z.string().datetime().optional(),
});

export const UpdatePostSchema = PostSchema.pick({
	title: true,
	content: true,
	slug: true,
	status: true,
})
	.partial()
	.extend({
		published_at: z.string().datetime().optional(),
	});

export type Post = z.infer<typeof PostSchema>;
export type CreatePost = z.infer<typeof CreatePostSchema>;
export type UpdatePost = z.infer<typeof UpdatePostSchema>;
