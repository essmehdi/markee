import { VaultItem } from "@/lib/vaults/types";
import clsx from "clsx";
import { RowRendererProps } from "react-arborist";

export default function CustomRow({
	node,
	children,
	attrs,
	innerRef,
}: RowRendererProps<VaultItem>) {
	const className = clsx(
		"hover:bg-neutral-100 flex items-center justify-between rounded-lg cursor-pointer mx-5",
		{
			"bg-neutral-100": node.isSelected,
		}
	);

	return (
		<div
			ref={innerRef}
			className={className}
			onClick={() => node.toggle()}
			{...attrs}
		>
			{children}
		</div>
	);
}
