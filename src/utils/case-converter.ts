import snakecaseKeys from "snakecase-keys";
import camelcaseKeys from "camelcase-keys";
import type { BaseOffering } from "@/types/offerings";

/**
 * <<使い方>>
 * @see [case-converter.md](./case-converter.md)
 */

/**
/**
 * スネークケースからキャメルケースへの変換
 * @param S スネークケースの文字列
 * @returns キャメルケースの文字列
 */
export type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
	? `${Lowercase<T>}${Capitalize<SnakeToCamelCase<U>>}`
	: S;
export type SnakeToCamelCaseNested<T> = T extends object
	? {
			[K in keyof T as SnakeToCamelCase<K & string>]: SnakeToCamelCaseNested<T[K]>;
		}
	: T;

/**
 * キャメルケースからスネークケースへの変換
 * @param S キャメルケースの文字列
 * @returns スネークケースの文字列
 */
export type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
	? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${CamelToSnakeCase<U>}`
	: S;

export type CamelCaseToSnakeNested<T> = T extends object
	? {
			[K in keyof T as CamelToSnakeCase<K & string>]: CamelCaseToSnakeNested<T[K]>;
		}
	: T;

export const camelToSnake = <
	T extends Record<string, unknown> | readonly Record<string, unknown>[],
>(
	data: T,
): CamelCaseToSnakeNested<T> =>
	snakecaseKeys(data, { deep: true }) as unknown as CamelCaseToSnakeNested<T>;
export const snakeToCamel = <
	T extends Record<string, unknown> | readonly Record<string, unknown>[],
>(
	data: T,
): SnakeToCamelCaseNested<T> =>
	camelcaseKeys(data, { deep: true }) as unknown as SnakeToCamelCaseNested<T>;

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
	? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
	: Lowercase<S>;

export type KeysToCamelCase<T> = {
	[K in keyof T as CamelCase<string & K>]: T[K];
};

export type OfferingWithCamelCase = KeysToCamelCase<BaseOffering>;

/**
 * スネークケースのオブジェクトをキャメルケースに変換する
 * @param obj スネークケースのオブジェクト
 * @returns キャメルケースのオブジェクト
 */
export function toCamelCase<T extends Record<string, any>>(obj: T): KeysToCamelCase<T> {
	if (Array.isArray(obj)) {
		return obj.map((item) => toCamelCase(item)) as any;
	}

	if (obj !== null && typeof obj === "object") {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
				toCamelCase(value),
			]),
		) as KeysToCamelCase<T>;
	}

	return obj as any;
}
