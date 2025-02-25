import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { VaultFile, VaultItem } from "@/lib/vaults/types";
import { DotsThreeVertical, File, Folder, FolderOpen } from "@phosphor-icons/react";
import clsx from "clsx";
import { NodeRendererProps } from "react-arborist";
import BrowserDirectoryMenuContent from "./menu/directory-menu";
import BrowserFileMenuContent from "./menu/file-menu";
import { useSourceManager } from "@/lib/store/source-manager";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { MouseEvent, useContext } from "react";
import BrowserContext from "@/components/editor/vault-manager/browser/context";
import BrowserSelectionMenu from "@/components/editor/vault-manager/browser/menu/selection-menu";

export default function BrowserItem({ node, style, tree }: NodeRendererProps<VaultItem>) {
	const { clipboard, selection } = useContext(BrowserContext);
	const inSelection = selection.includes(node.data);

	const changeCurrentSelection = useSourceManager((state) => state.changeCurrentSelection);
	const vault = useSourceManager((state) => state.currentSelection.vault);
	const source = useSourceManager((state) => state.currentSource);

	const isCurrentSource =
		source && vault?.id === source.vault.id && source.file.absolutePath === node.data.absolutePath;

	const className = clsx(
		"hover:bg-neutral-100 flex items-center justify-between rounded-lg h-full cursor-pointer mx-5 relative select-none",
		{
			"bg-neutral-100": node.isSelected,
		}
	);

	const openFile = () => {
		if (node.data.type === "file") {
			// If it is a file, set it as the source for the editor
			changeCurrentSelection(vault, node.data);
			tree.select(node);
		}
	};

	const onItemClick = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		if ((event.metaKey || event.ctrlKey) && !node.tree.props.disableMultiSelection) {
			node.isSelected ? node.deselect() : node.selectMulti();
		} else if (event.shiftKey && !node.tree.props.disableMultiSelection) {
			node.selectContiguous();
		} else {
			node.select();
			node.activate();
		}
	};

	return (
		<div style={style} className={className} onClick={onItemClick} onDoubleClick={openFile}>
			{Array.from({ length: node.level }, (_, index) => {
				return (
					<div
						key={index}
						style={{
							left: `calc(${index} * 24px + 0.75rem + 9px)`, // Level padding + self padding + half of icon size
						}}
						className={`absolute top-0 h-full w-0.5 -translate-x-1/2 bg-neutral-100`}
					></div>
				);
			})}
			<ContextMenu modal={false}>
				<ContextMenuTrigger asChild>
					<div
						className="flex grow items-center gap-2 truncate p-3"
						onClick={() => node.data.type === "directory" && node.toggle()}
					>
						<div className="shrink-0">
							{node.data.type === "file" ? (
								<File className="text-neutral-500" weight={isCurrentSource ? "fill" : undefined} />
							) : node.isOpen ? (
								<FolderOpen className="text-primary" />
							) : (
								<Folder className="text-primary" />
							)}
						</div>
						<p data-selected={isCurrentSource} className="line-clamp-1 data-[selected=true]:font-bold">
							{node.data.name}
						</p>
					</div>
				</ContextMenuTrigger>
				{!inSelection || selection.length === 1 ? (
					node.data.type === "directory" ? (
						<BrowserDirectoryMenuContent directory={node.data} />
					) : (
						<BrowserFileMenuContent file={node.data} />
					)
				) : (
					<></>
				)}
				{inSelection && selection.length > 1 && <BrowserSelectionMenu />}
			</ContextMenu>
		</div>
	);
}
