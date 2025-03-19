import { Info, Warning } from "@phosphor-icons/react";
import clsx from "clsx";

type MessageProps = {
	message: string;
	icon?: JSX.Element;
	error?: boolean;
	overlay?: boolean;
};

export default function Message({
	icon,
	error,
	message,
	overlay,
}: MessageProps) {
	const className = clsx("space-y-3 max-w-lg mx-auto", {
		"text-red-400": error,
		"text-neutral-400": !error,
		"absolute left-0 top-0 w-full h-full flex flex-col justify-center items-center":
			overlay,
		"p-10": !overlay,
	});
	return (
		<div className={className}>
			<div className="flex justify-center">
				{icon ? icon : error ? <Warning size={30} /> : <Info size={30} />}
			</div>
			<p className="text-center">{message}</p>
		</div>
	);
}
