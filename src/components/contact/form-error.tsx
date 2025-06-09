"use client";

interface FormErrorProps {
	message: string;
}

export default function FormError({ message }: FormErrorProps) {
	return <p className="text-red-600 text-sm mt-1">{message}</p>;
}
