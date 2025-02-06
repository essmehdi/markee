import Message from "@/components/common/message";
import BrowserDirectoryMenuContent from "@/components/editor/vault-manager/browser/menu/directory-menu";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSourceManager } from "@/lib/store/source-manager";
import { Vault, VaultDirectory, VaultItem } from "@/lib/vaults/types";
import { CaretDown, CircleNotch, DotsThreeVertical } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NodeApi, Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import BrowserItem from "./item";

type BrowserProps = {
	vault: Vault;
};

export default function Browser({ vault }: BrowserProps) {
	const changeCurrentSelection = useSourceManager((state) => state.changeCurrentSelection);
	const currentSelection = useSourceManager((state) => state.currentSelection);

	const { ref: treeParentRef, height, width } = useResizeObserver<HTMLDivElement>();

	const queryClient = useQueryClient();
	const {
		data: items,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["vault", vault.id],
		queryFn: () => vault.getRootContent(),
	});

	const onItemActivate = async (selectedNode: NodeApi<VaultItem>) => {
		if (selectedNode.data.type === "directory" && (selectedNode.data as VaultDirectory).content === null) {
			// If it is a directory, expand all files
			const dirPath = selectedNode.data.absolutePath;
			await vault.expandDirectoryContent(dirPath);
			queryClient.invalidateQueries({ queryKey: ["vault", vault.id] });
		} else if (selectedNode.data.type === "file") {
			// If it is a file, set it as the source for the editor
			const filePath = selectedNode.data.absolutePath;
			changeCurrentSelection(vault, filePath);
		}
	};

	if (isLoading)
		return <Message icon={<CircleNotch className="animate-spin" size={30} />} message="Loading files" error />;

	if (error || !items) return <Message message="Could not fetch files" error />;

	return (
		<div className="flex grow flex-col">
			<div className="flex items-center justify-between">
				<p className="px-8 font-bold text-primary">Files</p>
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
						<Button size="icon" variant="ghost" className="shrink-0 hover:bg-transparent mr-5 text-primary">
							<CaretDown />
						</Button>
					</DropdownMenuTrigger>
					<BrowserDirectoryMenuContent directoryPath="/" />
				</DropdownMenu>
			</div>
			{items.length > 0 ? (
				<div className="grow" ref={treeParentRef}>
					<Tree
						data={items}
						openByDefault={false}
						idAccessor="absolutePath"
						childrenAccessor="content"
						onActivate={onItemActivate}
						width={width}
						height={height}
						rowHeight={40}
						selection={currentSelection.filePath ?? undefined}
					>
						{BrowserItem}
					</Tree>
				</div>
			) : (
				<Message message="No supported file found" />
			)}
		</div>
	);
}
