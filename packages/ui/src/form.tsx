import type { FieldErrors } from "@kouden/domain";
import type { Child, FC } from "hono/jsx";
import { ui } from "./ui.ts";

/** フォームの再表示用の値（送信された文字列をそのまま保持する） */
export type FormValues = Record<string, string | undefined>;

export const Field: FC<{
	label: string;
	name: string;
	/** 同じ name の入力欄が 1 画面に複数ある場合に、id を一意にするための接頭辞 */
	idPrefix?: string;
	error?: string | undefined;
	hint?: string;
	required?: boolean;
	class?: string;
	children?: Child;
}> = ({ label, name, idPrefix, error, hint, required, class: className, children }) => {
	const id = fieldId(name, idPrefix);
	return (
		<div class={`space-y-1 ${className ?? ""}`}>
			<label for={id} class={ui.label}>
				{label}
				{/* 読み上げでは「氏名（必須）」と続けて読まれるようにする */}
				{required && (
					<>
						<span class="ml-1 text-xs text-danger" aria-hidden="true">
							必須
						</span>
						<span class="sr-only">（必須）</span>
					</>
				)}
			</label>
			{children}
			{hint && !error && <p class="text-xs text-muted">{hint}</p>}
			{error && (
				<p id={`${id}-error`} class="text-sm text-danger">
					{error}
				</p>
			)}
		</div>
	);
};

/** 項目ごとのエラーがあるか（あれば app.js が最初のエラーの欄にフォーカスを移すので、autofocus は付けない） */
const hasFieldErrors = (errors: FieldErrors | undefined) =>
	errors !== undefined && Object.keys(errors).some((k) => k !== "_form");

export const fieldId = (name: string, prefix?: string) =>
	prefix ? `${prefix}-${name}` : `f-${name}`;

type InputProps = {
	name: string;
	idPrefix?: string;
	values: FormValues;
	errors?: FieldErrors;
	type?: string;
	inputmode?: "numeric" | "tel" | "text" | "search";
	autocomplete?: string;
	required?: boolean;
	autofocus?: boolean;
	placeholder?: string;
	class?: string;
	maxlength?: number;
	extra?: Record<string, string>;
};

export const Input: FC<InputProps> = (p) => {
	const id = fieldId(p.name, p.idPrefix);
	const error = p.errors?.[p.name];
	return (
		<input
			id={id}
			name={p.name}
			type={p.type ?? "text"}
			value={p.values[p.name] ?? ""}
			inputmode={p.inputmode}
			autocomplete={p.autocomplete ?? "off"}
			required={p.required}
			autofocus={p.autofocus && !hasFieldErrors(p.errors)}
			placeholder={p.placeholder}
			maxlength={p.maxlength}
			class={`${ui.input} ${p.class ?? ""}`}
			aria-invalid={error ? "true" : undefined}
			aria-describedby={error ? `${id}-error` : undefined}
			{...p.extra}
		/>
	);
};

export const Textarea: FC<{
	name: string;
	idPrefix?: string;
	values: FormValues;
	errors?: FieldErrors;
	rows?: number;
}> = ({ name, idPrefix, values, errors, rows }) => {
	const id = fieldId(name, idPrefix);
	return (
		<textarea
			id={id}
			name={name}
			rows={rows ?? 3}
			class={ui.input}
			aria-invalid={errors?.[name] ? "true" : undefined}
			aria-describedby={errors?.[name] ? `${id}-error` : undefined}
		>
			{values[name] ?? ""}
		</textarea>
	);
};

export const Select: FC<{
	name: string;
	idPrefix?: string;
	values: FormValues;
	errors?: FieldErrors;
	options: readonly { value: string; label: string }[];
	/** 先頭に置く「未選択」の表示（省略すると未選択を置かない） */
	blank?: string;
	required?: boolean;
	class?: string;
}> = ({ name, idPrefix, values, errors, options, blank, required, class: className }) => {
	const id = fieldId(name, idPrefix);
	const current = values[name] ?? "";
	return (
		<select
			id={id}
			name={name}
			required={required}
			class={`${ui.input} ${className ?? ""}`}
			aria-invalid={errors?.[name] ? "true" : undefined}
			aria-describedby={errors?.[name] ? `${id}-error` : undefined}
		>
			{blank !== undefined && <option value="">{blank}</option>}
			{options.map((o) => (
				<option value={o.value} selected={o.value === current}>
					{o.label}
				</option>
			))}
		</select>
	);
};

/** 項目に属さないエラー（`_form`）と、件数の要約 */
/** message はリンクを含められる（上限に達したときの購入の案内など） */
export const FormAlert: FC<{ errors?: FieldErrors; message?: Child }> = ({ errors, message }) => {
	const text = message ?? errors?._form;
	const count = errors ? Object.keys(errors).filter((k) => k !== "_form").length : 0;
	if (!text && count === 0) return null;
	return (
		<div role="alert" class={ui.alert}>
			{text ?? `入力内容を確認してください（${count} 件）`}
		</div>
	);
};

/** 楽観ロック用の version と、そのほかの hidden */
export const Hidden: FC<{ name: string; value: string | number }> = ({ name, value }) => (
	<input type="hidden" name={name} value={String(value)} />
);
