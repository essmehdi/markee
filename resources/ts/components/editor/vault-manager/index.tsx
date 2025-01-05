import { useCallback, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Button } from "../../ui/button";
import { Plus, Vault } from "@phosphor-icons/react";
import { Dialog, DialogTrigger } from "../../ui/dialog";
import NewVaultDialog from "./new-vault-dialog";
import LocalVault from "@/lib/vaults/local-vault";
import { useQuery } from "@tanstack/react-query";
import Browser from "./browser";
import Message from "@/components/common/message";
import { useSourceManager } from "@/lib/store/source-manager";
import useDialog from "@/lib/store/dialog-manager";

export default function VaultBrowser() {
	const sourceManager = useSourceManager();
	const showDialog = useDialog((state) => state.showDialog);
	const closeDialog = useDialog((state) => state.closeDialog);

	const { data: vaults, isLoading } = useQuery({
		queryKey: ["vaults"],
		queryFn: () => LocalVault.getAllLocalVaultsFromIndexedDB(),
	});

	const setSelectedVault = (vaultId: string) => {
		const vault = vaults!.find((vault) => vault.id === vaultId)!;
		sourceManager.changeCurrentSelection(vault, null);
	};

	const showNewVaultDialog = () => {
		showDialog(<NewVaultDialog closeDialog={closeDialog} />);
	};

	return (
		<div className="flex flex-col items-stretch grow">
			<div className="flex gap-2 items-center p-5">
				<Select
					value={sourceManager.currentSelection.vault?.id ?? undefined}
					onValueChange={setSelectedVault}
				>
					<SelectTrigger className="w-96">
						<SelectValue
							placeholder={isLoading ? "Loading vaults..." : "Select a vault"}
						/>
					</SelectTrigger>
					<SelectContent position="popper">
						{vaults?.map((vault) => (
							<SelectItem key={vault.id} value={vault.id}>
								{vault.name}
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
							onClick={showNewVaultDialog}
						>
							<Plus />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Add vault</TooltipContent>
				</Tooltip>
			</div>
			{sourceManager.currentSelection.vault ? (
				<Browser vault={sourceManager.currentSelection.vault} />
			) : (
				<div className="relative grow">
					<Message icon={<Vault size={30} />} message="Choose or add a vault" />
				</div>
			)}
		</div>
	);
}
