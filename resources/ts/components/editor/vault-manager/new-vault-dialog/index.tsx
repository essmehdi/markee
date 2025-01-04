import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import LocalVaultForm from "./local-vault-form";
import { Label } from "@/components/ui/label";

type NewVaultDialogProps = {
	/** The function to call to close the dialog after submit */
	closeDialog: () => void;
}

/**
 * Dialog component to add a new vault 
 */
export default function NewVaultDialog({ closeDialog }: NewVaultDialogProps) {
	const [newVaultType, setNewVaultType] = useState("local");

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>New vault</DialogTitle>
				<DialogDescription>Select the type of the vault and supply its details</DialogDescription>
			</DialogHeader>
			<div className="w-full space-y-1.5">
				<Label htmlFor="vault-type">Vault type</Label>
				<Select value={newVaultType} onValueChange={setNewVaultType}>
					<SelectTrigger className="w-full">
						<SelectValue id="vault-type" placeholder="Select a vault" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="local">Local vault</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{newVaultType === "local" ? <LocalVaultForm closeDialog={closeDialog} /> : <></>}
		</DialogContent>
	);
}
