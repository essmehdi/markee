import Message from "@/components/common/message";
import { Vault, VaultDirectory, VaultItem } from "@/lib/vaults/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NodeApi, Tree } from "react-arborist";
import Item from "./item";
import useResizeObserver from "use-resize-observer";
import { useSourceManager } from "@/lib/store/source-manager";
import { CircleNotch } from "@phosphor-icons/react";

type BrowserProps = {
	vault: Vault;
};

export default function Browser({ vault }: BrowserProps) {
	const sourceStore = useSourceManager();
	const {
		ref: treeParentRef,
		height,
		width,
	} = useResizeObserver<HTMLDivElement>();

	const queryClient = useQueryClient();
	const {
		data: items,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["vault", vault.id],
		queryFn: () => vault.getTree(),
	});

	const onItemActivate = async (selectedNode: NodeApi<VaultItem>) => {
		if (
			selectedNode.data.type === "directory" &&
			(selectedNode.data as VaultDirectory).content === null
		) {
			// If it is a directory, expand all files
			const dirPath = selectedNode.data.absolutePath;
			await vault.expandDirectoryContent(dirPath);
			queryClient.invalidateQueries({ queryKey: ["vault", vault.id] });
		} else if (selectedNode.data.type === "file") {
			// If it is a file, set it as the source for the editor
			const filePath = selectedNode.data.absolutePath;
			sourceStore.changeCurrentSelection(vault, filePath);
		}
	};

	if (isLoading)
		return (
			<Message
				icon={<CircleNotch className="animate-spin" size={30} />}
				message="Loading files"
				error
			/>
		);

	if (error || !items) return <Message message="Could not fetch files" error />;

	return (
		<div ref={treeParentRef} className="grow">
			{items.length > 0 ? (
				<Tree
					data={items}
					openByDefault={false}
					idAccessor="absolutePath"
					childrenAccessor="content"
					onActivate={onItemActivate}
					width={width}
					height={height}
					rowHeight={40}
					selection={sourceStore.currentSelection.filePath ?? undefined}
				>
					{Item}
				</Tree>
			) : (
				<Message message="No supported file found" />
			)}
		</div>
	);
}
