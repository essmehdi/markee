import NewVaultDialog from "@/components/editor/vault-manager/dialogs/new-vault-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import useConfirmationAlert from "@/lib/store/confirmation-alert-manager";
import BrowserVault from "@/lib/vaults/browser-vault";
import LocalVault from "@/lib/vaults/local-vault";
import { Vault } from "@/lib/vaults/types";
import { CircleNotch, Export, Plus, Trash } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function VaultManagerDialog() {
	const queryClient = useQueryClient();
	const [openNewVaultDialog, setOpenNewVaultDialog] = useState(false);
	const [exportingVaultId, setExportingVaultId] = useState<string | null>(null);
	const { showConfirmationAlert } = useConfirmationAlert();

	const { data: vaults } = useQuery({
		queryKey: ["vaults"],
		queryFn: async () => [
			...(await BrowserVault.getAllBrowserVaults()),
			...(await LocalVault.getAllLocalVaultsFromIndexedDB()),
		],
	});

	const showNewVaultDialog = () => {
		setOpenNewVaultDialog(true);
	};

	const closeNewVaultDialog = () => {
		setOpenNewVaultDialog(false);
	};

	const deleteVault = (vault: Vault) => {
		const doDelete = () => {
			vault.delete();
			queryClient.invalidateQueries({ queryKey: ["vaults"] });
		};

		if (vault.type === "browser") {
			showConfirmationAlert(
				doDelete,
				"All your data will be lost!",
				"Proceeding with this will result in the deletion of the vault and ALL of its data."
			);
		} else {
			doDelete();
		}
	};

	const zipVault = (vault: BrowserVault) => {
		setExportingVaultId(vault.id);
		vault
			.zip()
			.then((zipped) => {
				const blobURL = URL.createObjectURL(zipped);
				const link = document.createElement("a");
				link.download = "exported-vault.zip";
				link.href = blobURL;
				link.click();
				URL.revokeObjectURL(blobURL);
			})
			.finally(() => {
				setExportingVaultId(null);
			});
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>Manage your vaults</DialogTitle>
			</DialogHeader>
			<div className="space-y-5">
				{vaults && vaults.length > 0 && false ? (
					<ScrollArea>
						<div className="max-h-80 divide-y">
							{vaults?.map((vault) => (
								<div className="mr-5 flex justify-between py-3">
									<div>
										<p className="font-bold">{vault.name}</p>
										<p className="text-sm capitalize text-muted-foreground">{vault.type}</p>
									</div>
									<div className="flex items-center gap-2">
										{vault.type === "browser" && (
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														disabled={exportingVaultId !== null}
														onClick={() => zipVault(vault)}
													>
														{exportingVaultId === vault.id ? <CircleNotch className="animate-spin" /> : <Export />}
													</Button>
												</TooltipTrigger>
												<TooltipContent>Export data</TooltipContent>
											</Tooltip>
										)}
										<Tooltip>
											<TooltipTrigger asChild>
												<Button variant="destructive" size="icon" onClick={() => deleteVault(vault)}>
													<Trash />
												</Button>
											</TooltipTrigger>
											<TooltipContent>Delete vault</TooltipContent>
										</Tooltip>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				) : (
					<div className="p-10 text-muted-foreground text-center">No vault here yet</div>
				)}
				<Button onClick={showNewVaultDialog} className="w-full">
					<Plus />
					Add new vault
				</Button>
				<Dialog open={openNewVaultDialog} onOpenChange={setOpenNewVaultDialog}>
					<DialogContent>
						<NewVaultDialog closeDialog={closeNewVaultDialog} />
					</DialogContent>
				</Dialog>
			</div>
		</>
	);
}
