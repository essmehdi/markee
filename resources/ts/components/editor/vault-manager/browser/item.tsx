import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VaultDirectory, VaultFile, VaultItem } from "@/lib/vaults/types";
import { DotsThreeVertical, File, Folder } from "@phosphor-icons/react";
import clsx from "clsx";
import { NodeRendererProps } from "react-arborist";
import BrowserDirectoryMenuContent from "./menu/directory-menu";
import BrowserFileMenuContent from "./menu/file-menu";

export default function BrowserItem({
	node,
	style,
}: NodeRendererProps<VaultItem>) {
	const className = clsx(
		"hover:bg-neutral-100 flex items-center justify-between rounded-lg h-full cursor-pointer mx-5",
		{
			"bg-neutral-100": node.isSelected,
		},
	);

	return (
		<div style={style} className={className}>
			<div
				className="flex items-center gap-2 truncate grow p-3"
				onClick={() => node.toggle()}
			>
				<div className="shrink-0">
					{node.data.type === "file" ? (
						<File className="text-neutral-500" />
					) : (
						<Folder className="text-primary" />
					)}
				</div>
				<p className="line-clamp-1">{node.data.name}</p>
			</div>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						size="icon"
						variant="ghost"
						className="shrink-0 hover:bg-transparent"
					>
						<DotsThreeVertical />
					</Button>
				</DropdownMenuTrigger>
				{node.data.type === "directory" && (
					<BrowserDirectoryMenuContent
						directory={node.data as VaultDirectory}
					/>
				)}
				{node.data.type === "file" && (
					<BrowserFileMenuContent file={node.data as VaultFile} />
				)}
			</DropdownMenu>
		</div>
	);
}
