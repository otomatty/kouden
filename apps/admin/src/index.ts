import { createAdminApp } from "./app.tsx";

const app = createAdminApp();

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Env>;
