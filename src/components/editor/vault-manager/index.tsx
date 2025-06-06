import Message from "~/components/common/message";
import useDialog from "~/lib/store/dialog-manager";
import { useSourceManager } from "~/lib/store/source-manager";
import LocalVault from "~/lib/vaults/local-vault";
import { Gear, Plus, Vault } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import Browser from "./browser";
import NewVaultDialog from "./dialogs/new-vault-dialog";
import VaultSelectItem from "./vault-select-item";
import BrowserVault from "~/lib/vaults/browser-vault";
import { SyntheticEvent } from "react";
import VaultManagerDialog from "~/components/editor/vault-manager/dialogs/vault-manager-dialog";

export default function VaultBrowser() {
  const changeCurrentSelection = useSourceManager(
    (state) => state.changeCurrentSelection
  );
  const currentSelection = useSourceManager((state) => state.currentSelection);
  const showDialog = useDialog((state) => state.showDialog);
  const closeDialog = useDialog((state) => state.closeDialog);

  const { data: vaults, isLoading } = useQuery({
    queryKey: ["vaults"],
    queryFn: async () => [
      ...(await BrowserVault.getAllBrowserVaults()),
      ...(await LocalVault.getAllLocalVaultsFromIndexedDB()),
    ],
  });

  const setSelectedVault = (vaultId: string) => {
    const vault = vaults!.find((vault) => vault.id === vaultId)!;
    changeCurrentSelection(vault, null);
  };

  const showVaultManagerDialog = () => {
    showDialog(<VaultManagerDialog />);
  };

  return (
    <div className="flex max-h-full grow flex-col items-stretch">
      <div className="flex items-center gap-2 p-5">
        <Select
          value={currentSelection.vault?.id ?? undefined}
          onValueChange={setSelectedVault}
        >
          <SelectTrigger className="w-96">
            <SelectValue
              placeholder={isLoading ? "Loading vaults..." : "Select a vault"}
            />
          </SelectTrigger>
          <SelectContent position="popper">
            {(!vaults || vaults?.length === 0) && <p className="text-muted-foreground text-sm text-center p-2">Click on the <Gear className="inline" /> icon to manage your vaults</p>}
            {vaults?.map((vault) => (
              <SelectItem key={vault.id} value={vault.id}>
                <VaultSelectItem vault={vault} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="shrink-0"
              variant="ghost"
              size="icon"
              onClick={showVaultManagerDialog}
            >
              <Gear />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Manage vaults</TooltipContent>
        </Tooltip>
      </div>
      {currentSelection.vault ? (
        <Browser vault={currentSelection.vault} />
      ) : (
        <div className="relative grow">
          <Message icon={<Vault size={30} />} message="Choose or add a vault" />
        </div>
      )}
    </div>
  );
}
