/**
 * フォームコンポーネント群
 *
 * @example
 * ```tsx
 * // 基本的な使い方
 * const form = useForm<FormValues>({
 *   resolver: zodResolver(formSchema),
 *   defaultValues: {
 *     username: "",
 *     email: "",
 *   },
 * });
 *
 * return (
 *   <Form {...form}>
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <FormField
 *         control={form.control}
 *         name="username"
 *         render={({ field }) => (
 *           <FormItem>
 *             <FormLabel required>ユーザー名</FormLabel>
 *             <FormControl>
 *               <Input {...field} />
 *             </FormControl>
 *             <FormDescription>
 *               公開されるユーザー名です
 *             </FormDescription>
 *             <FormMessage />
 *           </FormItem>
 *         )}
 *       />
 *     </form>
 *   </Form>
 * );
 * ```
 */

"use client";

import * as React from "react";
import type * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
	Controller,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	useFormContext,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * フォームのコンテキストプロバイダー
 * react-hook-formのFormProviderのエイリアス
 */
const Form = FormProvider;

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
	{} as FormFieldContextValue,
);

/**
 * フォームフィールドのコンテキストプロバイダー
 * フィールドの状態管理とバリデーションを提供
 *
 * @example
 * ```tsx
 * <FormField
 *   control={form.control}
 *   name="email"
 *   render={({ field }) => (
 *     <FormItem>
 *       <FormLabel>メールアドレス</FormLabel>
 *       <FormControl>
 *         <Input {...field} />
 *       </FormControl>
 *       <FormMessage />
 *     </FormItem>
 *   )}
 * />
 * ```
 */
const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

type FormItemContextValue = {
	id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
	{} as FormItemContextValue,
);

/**
 * フォームアイテムのコンテナコンポーネント
 * FormLabel、FormControl、FormDescription、FormMessageをグループ化
 */
const FormItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const id = React.useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div ref={ref} className={cn("space-y-2", className)} {...props} />
		</FormItemContext.Provider>
	);
});
FormItem.displayName = "FormItem";

/**
 * フォームラベルのプロパティ定義
 * @property {boolean} required - 必須項目を示すラベルを表示
 * @property {boolean} optional - 任意項目を示すラベルを表示
 */
interface FormLabelProps
	extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
	required?: boolean;
	optional?: boolean;
}

/**
 * フォームのラベルコンポーネント
 * 必須/任意の表示が可能
 *
 * @example
 * ```tsx
 * <FormLabel required>ユーザー名</FormLabel>
 * <FormLabel optional>プロフィール画像</FormLabel>
 * ```
 */
const FormLabel = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	FormLabelProps
>(({ className, required, optional, children, ...props }, ref) => {
	const { error, formItemId } = useFormField();

	return (
		<div className="flex items-center gap-2">
			<Label
				ref={ref}
				className={cn(error && "text-destructive", className)}
				htmlFor={formItemId}
				{...props}
			>
				{children}
			</Label>
			{required && (
				<span className="rounded bg-destructive px-1.5 py-0.5 text-xs font-medium text-destructive-foreground">
					必須
				</span>
			)}
			{optional && (
				<span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
					任意
				</span>
			)}
		</div>
	);
});
FormLabel.displayName = "FormLabel";

/**
 * フォームの入力要素をラップするコンポーネント
 * エラー状態やアクセシビリティ属性を自動で設定
 */
const FormControl = React.forwardRef<
	React.ElementRef<typeof Slot>,
	React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
	const { error, formItemId, formDescriptionId, formMessageId } =
		useFormField();

	return (
		<Slot
			ref={ref}
			id={formItemId}
			aria-describedby={
				!error
					? `${formDescriptionId}`
					: `${formDescriptionId} ${formMessageId}`
			}
			aria-invalid={!!error}
			{...props}
		/>
	);
});
FormControl.displayName = "FormControl";

/**
 * フォームフィールドの説明文を表示するコンポーネント
 *
 * @example
 * ```tsx
 * <FormDescription>
 *   8文字以上の英数字を入力してください
 * </FormDescription>
 * ```
 */
const FormDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
	const { formDescriptionId } = useFormField();

	return (
		<p
			ref={ref}
			id={formDescriptionId}
			className={cn("text-[0.8rem] text-muted-foreground", className)}
			{...props}
		/>
	);
});
FormDescription.displayName = "FormDescription";

/**
 * フォームのエラーメッセージを表示するコンポーネント
 * バリデーションエラーを自動で表示
 */
const FormMessage = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message) : children;

	if (!body) {
		return null;
	}

	return (
		<p
			ref={ref}
			id={formMessageId}
			className={cn("text-[0.8rem] font-medium text-destructive", className)}
			{...props}
		>
			{body}
		</p>
	);
});
FormMessage.displayName = "FormMessage";

export {
	useFormField,
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
};
