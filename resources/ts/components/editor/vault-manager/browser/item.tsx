import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VaultFile, VaultItem } from "@/lib/vaults/types";
import { DotsThreeVertical, File, Folder, FolderOpen } from "@phosphor-icons/react";
import clsx from "clsx";
import { NodeRendererProps } from "react-arborist";
import BrowserDirectoryMenuContent from "./menu/directory-menu";
import BrowserFileMenuContent from "./menu/file-menu";
import { useSourceManager } from "@/lib/store/source-manager";

export default function BrowserItem({ node, style }: NodeRendererProps<VaultItem>) {
	const changeCurrentSelection = useSourceManager((state) => state.changeCurrentSelection);
	const vault = useSourceManager((state) => state.currentSelection.vault);

	const className = clsx(
		"hover:bg-neutral-100 flex items-center justify-between rounded-lg h-full cursor-pointer mx-5 relative",
		{
			"bg-neutral-100": node.isSelected,
		}
	);

	const alignmentIndicators = () => {
		return Array.from({ length: node.level }, (_, index) => {
			return (
				<div
					key={index}
					style={{
						left: `calc(${index} * 24px + 0.75rem + 9px)`, // Level padding + self padding + half of icon size
					}}
					className={`absolute top-0 h-full w-0.5 -translate-x-1/2 bg-neutral-100`}
				></div>
			);
		});
	};

	const openFile = () => {
		if (node.data.type === "file") {
			// If it is a file, set it as the source for the editor
			const filePath = node.data.absolutePath;
			changeCurrentSelection(vault, filePath);
		}
	};

	return (
		<div style={style} className={className} onDoubleClick={openFile}>
			{alignmentIndicators()}
			<div
				className="flex grow items-center gap-2 truncate p-3"
				onClick={() => node.data.type === "directory" && node.toggle()}
			>
				<div className="shrink-0">
					{node.data.type === "file" ? (
						<File className="text-neutral-500" />
					) : node.isOpen ? (
						<FolderOpen className="text-primary" />
					) : (
						<Folder className="text-primary" />
					)}
				</div>
				<p className="line-clamp-1">{node.data.name}</p>
			</div>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
					<Button size="icon" variant="ghost" className="shrink-0 hover:bg-transparent">
						<DotsThreeVertical />
					</Button>
				</DropdownMenuTrigger>
				{node.data.type === "directory" && <BrowserDirectoryMenuContent directoryPath={node.data.absolutePath} />}
				{node.data.type === "file" && <BrowserFileMenuContent file={node.data as VaultFile} />}
			</DropdownMenu>
		</div>
	);
}
