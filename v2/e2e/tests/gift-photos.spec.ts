import { expect, test } from "@playwright/test";
import { expectAccessible, loginAs } from "./fixtures.ts";
import { USERS } from "./users.ts";

test("移行した供花の写真と説明を詳細画面に表示する", async ({ request, page, context }) => {
	const id = crypto.randomUUID();
	const photoId = crypto.randomUUID();
	const key = `koudens/${id}/gifts/gift/${photoId}`;
	const at = "2024-01-01T00:00:00.000Z";
	const owner = USERS.photos.id;
	const audit = { createdBy: owner, updatedBy: owner, createdAt: at, updatedAt: at };
	const headers = { Authorization: "Bearer dev-import-token" };
	// デコードできる PNG。実データは使わない。
	const bytes = Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=",
		"base64",
	);
	const digest = Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex");
	expect(
		(
			await request.put(`/internal/import/files?key=${encodeURIComponent(key)}`, {
				headers: { ...headers, "X-Content-SHA256": digest, "Content-Type": "image/png" },
				data: bytes,
			})
		).status(),
	).toBe(200);
	expect(
		(
			await request.put(`/internal/import/koudens/${id}`, {
				headers,
				data: {
					koudenId: id,
					kouden: {
						legacyKoudenId: id,
						title: "写真移行の確認",
						deceasedName: "確認 太郎",
						ownerUserId: owner,
						status: "active",
						createdAt: at,
						updatedAt: at,
					},
					members: [{ userId: owner, role: "owner", joinedAt: at, invitedBy: null }],
					purchases: [],
					ledger: {
						events: [{ id: "event", kind: "funeral", name: "葬儀", date: null, sortOrder: 0 }],
						relationships: [],
						persons: [
							{
								id: "person",
								name: "差出人 花子",
								nameKana: null,
								organization: null,
								position: null,
								relationshipId: null,
								postalCode: null,
								address: null,
								phone: null,
								notes: null,
								...audit,
							},
						],
						gifts: [
							{
								id: "gift",
								eventId: "event",
								kind: "kyoka",
								amount: null,
								itemName: "供花",
								quantity: 1,
								message: null,
								attendance: null,
								notes: null,
								...audit,
							},
						],
						contributors: [
							{ giftId: "gift", personId: "person", isPrimary: true, shareAmount: null },
						],
						giftPhotos: [
							{
								id: photoId,
								giftId: "gift",
								r2Key: key,
								caption: "祭壇の供花 <確認>",
								createdBy: owner,
								createdAt: at,
								updatedAt: at,
							},
						],
						returnItems: [],
						returnRules: [],
						returns: [],
						returnLines: [],
					},
				},
			})
		).status(),
	).toBe(200);
	await loginAs(context, USERS.photos);
	await page.goto(`/k/${id}/gifts/gift`);
	const photos = page.getByRole("region", { name: "供物・供花の写真" });
	const photo = photos.getByRole("img", { name: "祭壇の供花 <確認>" });
	await expect(photo).toBeVisible();
	await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
	await expect(photos.locator("figcaption")).toHaveText("祭壇の供花 <確認>");
	await expectAccessible(page, "移行した供花の写真");
});
