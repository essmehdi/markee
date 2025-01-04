import { VaultItem } from "@/lib/vaults/types";
import { File, Folder } from "@phosphor-icons/react";
import clsx from "clsx";
import { NodeRendererProps } from "react-arborist";

export default function Item({
	node,
	style,
}: NodeRendererProps<VaultItem>) {
	const levelIndicator = new Array(node.level)
		.fill(false)
		.map((_, i) => <div key={i} className="w-2"></div>);

	const className = clsx(
		"hover:bg-neutral-100 flex items-center gap-2 rounded-lg h-full !p-3 cursor-pointer mx-5 truncate",
		{
			"bg-neutral-100": node.isSelected,
		}
	);

	return (
		<div style={style} className={className} onClick={() => node.toggle()}>
			{levelIndicator}
			<div className="shrink-0">
				{node.data.type === "file" ? (
					<File className="text-neutral-500"/*  weight={"fill"} */ />
				) : (
					<Folder className="text-primary"/*  weight={"fill"} */ />
				)}
			</div>
			<p className="line-clamp-1 text-ellipsis">{node.data.name}</p>
		</div>
	);
}
