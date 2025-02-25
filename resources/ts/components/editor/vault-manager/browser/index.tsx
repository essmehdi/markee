import Message from "@/components/common/message";
import BrowserClipboardIndicator from "@/components/editor/vault-manager/browser/clipboard-indicator";
import BrowserContext from "@/components/editor/vault-manager/browser/context";
import BrowserDirectoryMenuContent from "@/components/editor/vault-manager/browser/menu/directory-menu";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useHotkey } from "@/hooks/use-hotkey";
import useVault from "@/hooks/vaults/use-vault";
import { useSourceManager } from "@/lib/store/source-manager";
import BaseLocalVault from "@/lib/vaults/base-local-vault";
import { Vault, VaultDirectory, VaultItem } from "@/lib/vaults/types";
import { CircleNotch } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NodeApi, Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import BrowserItem from "./item";
import { BROWSER_HOTKEYS } from "@/components/editor/vault-manager/browser/hotkeys";
import { useToast } from "@/hooks/use-toast";

type BrowserProps = {
	vault: Vault;
};

export type Clipboard = {
	items: VaultItem[];
	move: boolean;
};

function getFolderChildrenPaths(node: NodeApi<VaultItem>): string[] {
	const result: string[] = [];
	node.children?.forEach((child) => {
		if (child.data.type === "directory") {
			result.push(...getFolderChildrenPaths(child));
		} else {
			result.push(child.data.absolutePath);
		}
	});
	return result;
}

function processSelection(nodes: NodeApi<VaultItem>[]): VaultItem[] {
	nodes.sort((a, b) => (a.data.type === "directory" && b.data.type === "file" ? -1 : 1));
	const selectedFoldersChildren = new Set<string>();
	const result: VaultItem[] = [];
	for (let i = 0; i < nodes.length; i++) {
		const item = nodes[i];
		if (item.data.type === "directory") {
			getFolderChildrenPaths(item).forEach((path) => {
				selectedFoldersChildren.add(path);
			});
			result.push(item.data);
		} else if (item.data.type === "file") {
			if (!selectedFoldersChildren.has(item.data.absolutePath)) {
				result.push(item.data);
			}
		}
	}
	return result;
}

export default function Browser({ vault }: BrowserProps) {
	const { toast } = useToast();

	const currentSource = useSourceManager((state) => state.currentSource);
	const [clipboard, setClipboard] = useState<Clipboard>({ items: [], move: false });
	const [selection, setSelection] = useState<VaultItem[]>([]);
	const { ref: treeParentRef, height, width } = useResizeObserver<HTMLDivElement>();

	const queryClient = useQueryClient();
	const { items, copy, move, isFetching, isCopying, isMoving, fetchError, copyError, moveError } = useVault(vault, {
		onSettled: () => {
			setClipboard({ items: [], move: false });
		},
	});

	const onItemActivate = async (selectedNode: NodeApi<VaultItem>) => {
		if (selectedNode.data.type === "directory" && (selectedNode.data as VaultDirectory).content === null) {
			// If it is a directory, expand all files
			await vault.expandDirectoryContent(selectedNode.data);
			queryClient.invalidateQueries({ queryKey: ["vault", vault.id] });
		}
	};

	const onSelect = (nodes: NodeApi<VaultItem>[]) => {
		setSelection(processSelection(nodes));
	};

	const copyToClipboard = () => {
		setClipboard({ items: selection, move: false });
	};

	const cutToClipboard = () => {
		setClipboard({ items: selection, move: true });
	};

	const pasteClipboardItemsToFolder = () => {
		const destination = selection.length === 1 && selection[0].type === "directory" ? selection[0] : null;
		if (destination) {
			if (clipboard.move) {
				move({ items: clipboard.items, destination: destination });
			} else {
				copy({ items: clipboard.items, destination: destination });
			}
		}
	};

	useEffect(() => {
		console.log(copyError);
		if (copyError) {
			toast({ title: "Could not copy file(s)", description: copyError.message });
		}
	}, [copyError]);

	useEffect(() => {
		if (moveError) {
			toast({ title: "Could not move file(s)", description: moveError.message });
		}
	}, [moveError])

	useHotkey({ ...BROWSER_HOTKEYS.COPY_HOTKEY, callback: copyToClipboard });
	useHotkey({ ...BROWSER_HOTKEYS.CUT_HOTKEY, callback: cutToClipboard });
	useHotkey({ ...BROWSER_HOTKEYS.PASTE_HOTKEY, callback: pasteClipboardItemsToFolder });

	if (isFetching) {
		return <Message icon={<CircleNotch className="animate-spin" size={30} />} message="Loading files" error />;
	}

	if (fetchError || !items) return <Message message="Could not fetch files" error />;

	return (
		<BrowserContext.Provider value={{ selection, clipboard, setClipboard, copy, move }}>
			<div className="relative flex grow flex-col gap-2">
				<ContextMenu modal={false}>
					<ContextMenuTrigger>
						<div className="flex items-center justify-between">
							<p className="px-8 font-bold text-primary">Files</p>
						</div>
					</ContextMenuTrigger>
					<BrowserDirectoryMenuContent directory={BaseLocalVault.ROOT_DIRECTORY} />
				</ContextMenu>
				{items.length > 0 ? (
					<div className="grow" ref={treeParentRef}>
						<Tree
							data={items}
							openByDefault={false}
							idAccessor="absolutePath"
							childrenAccessor="content"
							onActivate={onItemActivate}
							onSelect={onSelect}
							width={width}
							height={height}
							rowHeight={40}
							selection={currentSource?.vault.id === vault.id ? currentSource?.file.absolutePath : undefined}
						>
							{BrowserItem}
						</Tree>
					</div>
				) : (
					<Message message="No supported file found" />
				)}
				<BrowserClipboardIndicator items={clipboard.items} isCopying={isCopying} isMoving={isMoving} />
			</div>
		</BrowserContext.Provider>
	);
}
