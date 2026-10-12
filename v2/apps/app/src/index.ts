import { createApp } from "./app.tsx";
import { runDailyMaintenance } from "./scheduled.ts";

const app = createApp();

export default {
	fetch: app.fetch,
	async scheduled(_controller, env, ctx) {
		ctx.waitUntil(runDailyMaintenance(env, new Date()));
	},
} satisfies ExportedHandler<Env>;
