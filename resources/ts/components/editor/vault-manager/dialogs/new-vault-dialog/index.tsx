import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VaultType } from "@/lib/vaults/types";
import React, { useState } from "react";
import BrowserVaultForm from "./browser-vault-form";
import LocalVaultForm from "./local-vault-form";

type NewVaultDialogProps = {
	/** The function to call to close the dialog after submit */
	closeDialog: () => void;
};

type VaultTypeOption = {
	name: string;
	disabled?: boolean;
};

const supportsFileSystemAPI = typeof window.showDirectoryPicker === "function";
const vaultTypes: Record<VaultType, VaultTypeOption> = {
	local: {
		name: "Local vault",
		disabled: !supportsFileSystemAPI,
	},
	browser: {
		name: "Browser vault",
	},
};

/**
 * Dialog component to add a new vault
 */
export default function NewVaultDialog({ closeDialog }: NewVaultDialogProps) {
	const [newVaultType, setNewVaultType] = useState<VaultType | undefined>(supportsFileSystemAPI ? undefined : "local");

	return (
		<>
			<DialogHeader>
				<DialogTitle>New vault</DialogTitle>
				<DialogDescription>Select the type of the vault and supply its details</DialogDescription>
			</DialogHeader>
			<div className="w-full space-y-1.5">
				<Label htmlFor="vault-type">Vault type</Label>
				<Select
					value={newVaultType}
					onValueChange={setNewVaultType as React.Dispatch<React.SetStateAction<string | undefined>>}
				>
					<SelectTrigger className="w-full">
						<SelectValue id="vault-type" placeholder="Select a vault" />
					</SelectTrigger>
					<SelectContent>
						{Object.keys(vaultTypes).map((vaultType) => {
							const vaultTypeOption = vaultTypes[vaultType as keyof typeof vaultTypes];
							return (
								<SelectItem key={vaultType} value={vaultType} disabled={vaultTypeOption.disabled}>
									{vaultTypeOption.name}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
				<p className="text-sm text-neutral-400">
					Local vault is only available with browsers that support the File System Access API
				</p>
			</div>
			{newVaultType === "local" && <LocalVaultForm closeDialog={closeDialog} />}
			{newVaultType === "browser" && <BrowserVaultForm closeDialog={closeDialog} />}
		</>
	);
}
