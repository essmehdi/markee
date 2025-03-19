import { Vault, VaultType } from "~/lib/vaults/types";
import { Browser, HardDrive } from "@phosphor-icons/react";

type VaultSelectItemProps = {
  vault: Vault;
};

const vaultTypeIconMap: Record<VaultType, JSX.Element> = {
  local: <HardDrive />,
  browser: <Browser />,
};

export default function VaultSelectItem({ vault }: VaultSelectItemProps) {
  return (
    <div className="flex items-center gap-2 leading-none">
      <div className="text-primary">{vaultTypeIconMap[vault.type]}</div>
      <div className="-space-y-0.5">
        <p className="text-left text-xs text-neutral-400 capitalize">
          {vault.type}
        </p>
        <p className="text-left text-sm font-semibold line-clamp-1 truncate">
          {vault.name}
        </p>
      </div>
    </div>
  );
}
