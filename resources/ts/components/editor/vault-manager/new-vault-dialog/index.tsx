import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import LocalVaultForm from "./local-vault-form";
import { Vault } from "@/lib/vaults/types";

type NewVaultDialogProps = {
	/** The function to call to close the dialog after submit */
	closeDialog: () => void;
};

type VaultTypeOption = {
	name: string;
	disabled?: boolean;
}

const supportsFileSystemAPI = typeof window.showDirectoryPicker === "function";
const vaultTypes: Record<Vault["type"], VaultTypeOption> = {
	"local": {
		name: "Local vault",
		disabled: !supportsFileSystemAPI
	},
}

/**
 * Dialog component to add a new vault
 */
export default function NewVaultDialog({ closeDialog }: NewVaultDialogProps) {

	const [newVaultType, setNewVaultType] = useState<string | undefined>(supportsFileSystemAPI ? undefined : "local");

	return (
		<>
			<DialogHeader>
				<DialogTitle>New vault</DialogTitle>
				<DialogDescription>
					Select the type of the vault and supply its details
				</DialogDescription>
			</DialogHeader>
			<div className="w-full space-y-1.5">
				<Label htmlFor="vault-type">Vault type</Label>
				<Select value={newVaultType} onValueChange={setNewVaultType}>
					<SelectTrigger className="w-full">
						<SelectValue id="vault-type" placeholder="Select a vault" />
					</SelectTrigger>
					<SelectContent>
						{Object.keys(vaultTypes).map((vaultType) => {
							const vaultTypeOption = vaultTypes[vaultType as keyof typeof vaultTypes]
							return (
								<SelectItem value={vaultType} disabled={vaultTypeOption.disabled}>
									{vaultTypeOption.name}
								</SelectItem>
							)
						})}
					</SelectContent>
				</Select>
				<p className="text-sm text-neutral-400">Local vault is only available with browsers that support the File System Access API</p>
			</div>
			{newVaultType === "local" && (
				<LocalVaultForm closeDialog={closeDialog} />
			)}
		</>
	);
}
