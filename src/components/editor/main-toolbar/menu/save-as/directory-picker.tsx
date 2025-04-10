import useVault from "~/hooks/vaults/use-vault";
import { Vault, VaultDirectory, VaultItem } from "~/lib/vaults/types";
import { File, Folder, FolderOpen } from "@phosphor-icons/react";
import clsx from "clsx";
import { NodeApi, NodeRendererProps, Tree } from "react-arborist";
import { useQueryClient } from "@tanstack/react-query";
import useResizeObserver from "use-resize-observer";
import Message from "~/components/common/message";
import BaseLocalVault from "~/lib/vaults/base-local-vault";

type DirectoryPickerProps = {
	vault: Vault;
	onSelect: (dir: VaultDirectory) => void;
	className?: string;
};

export default function DirectoryPicker({
	className,
	vault,
	onSelect,
}: DirectoryPickerProps) {
	const {
		ref: treeParentRef,
		height,
		width,
	} = useResizeObserver<HTMLDivElement>();
	const queryClient = useQueryClient();
	const { items, fetchError } = useVault(vault, {
		queryKey: ["directory-picker-vault", vault.id],
		filter: { type: "directory" },
	});

	const onActivate = (node: NodeApi<VaultItem>) => {
		vault.expandDirectoryContent(node.data as VaultDirectory);
		queryClient.invalidateQueries({
			queryKey: ["directory-picker-vault", vault.id],
		});
	};

	const onItemSelect = (nodes: NodeApi<VaultItem>[]) => {
		let selectedDirectory = nodes.length > 0 ? nodes[0].data : null;
		if (!selectedDirectory || selectedDirectory.absolutePath === "/") {
			selectedDirectory = BaseLocalVault.ROOT_DIRECTORY;
		}
		onSelect(selectedDirectory as VaultDirectory); // The vault items are filtered to allow only directories
	};

	const parentClassName = clsx(className, "border border-border rounded-lg");

	if (fetchError) {
		return <Message message="Could not fetch files" error />;
	}

	return (
		<div ref={treeParentRef} className={parentClassName}>
			<Tree
				data={
					[
						{
							...BaseLocalVault.ROOT_DIRECTORY,
							name: vault.name,
							content: items ?? [],
						},
					] as VaultItem[]
				}
				idAccessor="absolutePath"
				onActivate={onActivate}
				onSelect={onItemSelect}
				childrenAccessor="content"
				width={width}
				height={height}
				rowHeight={30}
				disableMultiSelection
			>
				{Directory}
			</Tree>
		</div>
	);
}

function Directory({ node, style, tree }: NodeRendererProps<VaultItem>) {
	const className = clsx(
		"hover:bg-neutral-100 flex items-center justify-between rounded-md h-full cursor-pointer relative select-none",
		{
			"bg-neutral-100": node.isSelected,
		},
	);

	return (
		<div style={style} className={className}>
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
			<div
				className="flex grow items-center gap-2 truncate p-3"
				onClick={() => node.data.type === "directory" && node.toggle()}
			>
				<div className="shrink-0">
					{node.data.type === "file" ? (
						<File
							className="text-neutral-500"
							weight={node.isSelected ? "fill" : undefined}
						/>
					) : node.isOpen ? (
						<FolderOpen className="text-primary" />
					) : (
						<Folder className="text-primary" />
					)}
				</div>
				<p
					data-selected={node.isSelected}
					className="line-clamp-1 data-[selected=true]:font-bold"
				>
					{node.data.name}
				</p>
			</div>
		</div>
	);
}
