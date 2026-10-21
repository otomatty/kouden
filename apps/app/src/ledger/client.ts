import type { KoudenLedger } from "./ledger.ts";

/** 香典帳の DO を取得する。日本から近い拠点に置く（04 §3） */
export function ledgerFor(env: Env, koudenId: string): DurableObjectStub<KoudenLedger> {
	const namespace = env.LEDGER as DurableObjectNamespace<KoudenLedger>;
	return namespace.get(namespace.idFromName(koudenId), { locationHint: "apac" });
}
