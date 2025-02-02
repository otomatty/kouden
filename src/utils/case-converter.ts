import snakecaseKeys from "snakecase-keys";
import camelcaseKeys from "camelcase-keys";

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
