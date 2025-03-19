import useVault from "~/hooks/vaults/use-vault";
import { Vault, VaultDirectory, VaultItem } from "~/lib/vaults/types";
import { File, Folder, FolderOpen } from "@phosphor-icons/react";
import clsx from "clsx";
import { NodeApi, NodeRendererProps, Tree } from "react-arborist";

type DirectoryPickerProps = {
  vault: Vault;
  onSelect: (dir: VaultDirectory) => void;
};

export default function DirectoryPicker({
  vault,
  onSelect,
}: DirectoryPickerProps) {
  const { items } = useVault(vault, { filter: { type: "directory" } });

  const onActivate = (node: NodeApi<VaultItem>) => {
    onSelect(node.data as VaultDirectory); // The vault items are filtered to allow only directories
  };

  return (
    <div>
      <Tree data={items} idAccessor="content" onActivate={onActivate}>
        {Directory}
      </Tree>
    </div>
  );
}

function Directory({ node, style, tree }: NodeRendererProps<VaultItem>) {
  const className = clsx(
    "hover:bg-neutral-100 flex items-center justify-between rounded-lg h-full cursor-pointer mx-5 relative select-none",
    {
      "bg-neutral-100": node.isSelected,
    }
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
