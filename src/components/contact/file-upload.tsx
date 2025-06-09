"use client";

import { type ChangeEvent, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
	name: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUpload({ name, onChange, ...rest }: FileUploadProps) {
	const [file, setFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0] ?? null;
		if (selected?.type.startsWith("image/")) {
			// 画像をWebPに変換
			const img = new Image();
			const reader = new FileReader();
			reader.onload = () => {
				img.onload = () => {
					const canvas = document.createElement("canvas");
					canvas.width = img.width;
					canvas.height = img.height;
					const ctx = canvas.getContext("2d");
					ctx?.drawImage(img, 0, 0);
					canvas.toBlob(
						(blob) => {
							if (blob) {
								const webpFile = new File([blob], selected.name.replace(/\.\w+$/, ".webp"), {
									type: "image/webp",
								});
								const dt = new DataTransfer();
								dt.items.add(webpFile);
								if (inputRef.current) inputRef.current.files = dt.files;
								setFile(webpFile);
								if (onChange)
									onChange({ target: { files: dt.files } } as ChangeEvent<HTMLInputElement>);
							}
						},
						"image/webp",
						0.8,
					);
				};
				img.src = reader.result as string;
			};
			reader.readAsDataURL(selected);
		} else {
			setFile(selected);
			if (onChange) onChange(e);
		}
		return;
	};

	const handleRemove = () => {
		setFile(null);
		setPreviewUrl(null);
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	useEffect(() => {
		if (file?.type.startsWith("image/")) {
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
			return () => URL.revokeObjectURL(url);
		}
		setPreviewUrl(null);
		return;
	}, [file]);

	return (
		<div>
			<Input
				id={name}
				name={name}
				type="file"
				accept="image/*,application/pdf,text/plain,application/zip"
				ref={inputRef}
				onChange={handleChange}
				{...rest}
				className="bg-background"
			/>
			{file && (
				<div className="mt-2 flex items-center space-x-4">
					{previewUrl ? (
						<img src={previewUrl} alt="preview" className="w-20 h-20 object-cover rounded" />
					) : (
						<div className="p-2 border rounded text-sm">{file.name}</div>
					)}
					<span className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
					<Button variant="ghost" size="sm" onClick={handleRemove}>
						削除
					</Button>
				</div>
			)}
		</div>
	);
}
