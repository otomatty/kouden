"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CreatePostSchema, UpdatePostSchema } from "@/schemas/posts";
import type { TPost } from "@/types/post";
import { getErrorMessage } from "@/utils/get-error-message";

/**
 * ブログ記事を作成する
 * @param data 作成データ
 * @returns 作成された記事
 */
export async function createPost(data: z.infer<typeof CreatePostSchema>) {
	const supabase = await createClient();
	try {
		const validatedData = CreatePostSchema.parse(data);

		const { data: authData, error: authError } = await supabase.auth.getUser();
		if (authError || !authData.user) {
			throw new Error("User not authenticated.");
		}

		const postData: Omit<TPost, "id" | "created_at" | "updated_at"> = {
			...validatedData,
			content: validatedData.content ?? "",
			excerpt: validatedData.excerpt ?? null,
			category: validatedData.category ?? null,
			organization_id: validatedData.organization_id ?? "",
			author_id: authData.user.id,
			published_at: validatedData.status === "published" ? new Date().toISOString() : null,
		};

		const { data: newPost, error } = await supabase
			.from("posts")
			.insert(postData)
			.select()
			.single();

		if (error) {
			throw error;
		}

		revalidatePath("/blog");
		revalidatePath(`/blog/${newPost.slug}`);

		return { data: newPost, error: null };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}

/**
 * ブログ記事を更新する
 * @param id 記事ID
 * @param data 更新データ
 * @returns 更新された記事
 */
export async function updatePost(id: string, data: z.infer<typeof UpdatePostSchema>) {
	const supabase = await createClient();
	try {
		const validatedData = UpdatePostSchema.parse(data);

		// If status is changed to 'published' and published_at is not set, set it to now.
		if (validatedData.status === "published") {
			const { data: currentPost } = await supabase
				.from("posts")
				.select("published_at")
				.eq("id", id)
				.single();
			if (currentPost && !currentPost.published_at) {
				validatedData.published_at = new Date().toISOString();
			}
		}

		const { data: updatedPost, error } = await supabase
			.from("posts")
			.update({ ...validatedData, updated_at: new Date().toISOString() })
			.eq("id", id)
			.select()
			.single();

		if (error) {
			throw error;
		}

		revalidatePath("/blog");
		revalidatePath(`/blog/${updatedPost.slug}`);

		return { data: updatedPost, error: null };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}

/**
 * ブログ記事を削除する
 * @param id 記事ID
 * @returns 削除結果
 */
export async function deletePost(id: string) {
	const supabase = await createClient();
	try {
		const { error: selectError, data: post } = await supabase
			.from("posts")
			.select("slug")
			.eq("id", id)
			.single();
		if (selectError) throw selectError;

		const { error } = await supabase.from("posts").delete().eq("id", id);

		if (error) {
			throw error;
		}

		revalidatePath("/blog");
		revalidatePath(`/blog/${post.slug}`);

		return { error: null };
	} catch (error) {
		return { error: getErrorMessage(error) };
	}
}

/**
 * 公開済みのブログ記事一覧を取得する
 * @returns 記事一覧
 */
export async function getPublishedPosts() {
	const supabase = await createClient();
	try {
		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.eq("status", "published")
			.order("published_at", { ascending: false });

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}

/**
 * スラッグで公開済みのブログ記事を取得する
 * @param slug 記事スラッグ
 * @returns 記事
 */
export async function getPublishedPostBySlug(slug: string) {
	const supabase = await createClient();
	try {
		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.eq("slug", slug)
			.eq("status", "published")
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}

/**
 * 自分の組織のブログ記事一覧を取得する（下書き含む）
 * @returns 記事一覧
 */
export async function getOrganizationPosts() {
	const supabase = await createClient();
	try {
		const { data: authData, error: authError } = await supabase.auth.getUser();
		if (authError || !authData.user) {
			throw new Error("User not authenticated.");
		}

		// RLSポリシーによって、ユーザーがアクセス可能な投稿のみが返される
		const { data, error } = await supabase
			.from("posts")
			.select("*")
			.order("updated_at", { ascending: false });

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}

/**
 * 現在のユーザーの組織IDを取得する（任意）
 * @returns 組織ID または null
 */
export async function getCurrentUserOrganizationId() {
	const supabase = await createClient();
	try {
		const { data: authData, error: authError } = await supabase.auth.getUser();
		if (authError || !authData.user) {
			throw new Error("User not authenticated.");
		}

		// RLSが設定されているので、直接postsテーブルから組織IDを取得
		const { data: posts, error } = await supabase.from("posts").select("organization_id").limit(1);

		if (error) {
			// 権限エラーの場合はnullを返す（組織なしで作成可能）
			return { data: null, error: null };
		}

		// 投稿がない場合はnullを返す
		if (!posts || posts.length === 0) {
			return { data: null, error: null };
		}

		return { data: posts[0]?.organization_id, error: null };
	} catch {
		// エラーが発生した場合もnullを返す（組織なしで作成可能）
		return { data: null, error: null };
	}
}

/**
 * IDで記事を取得する（自分の組織の記事のみ）
 * @param id 記事ID
 * @returns 記事
 */
export async function getPostById(id: string) {
	const supabase = await createClient();
	try {
		const { data: authData, error: authError } = await supabase.auth.getUser();
		if (authError || !authData.user) {
			throw new Error("User not authenticated.");
		}

		// RLSポリシーによって、ユーザーがアクセス可能な投稿のみが返される
		const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();

		if (error) throw error;

		return { data, error: null };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}
