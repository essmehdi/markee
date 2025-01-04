import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedVault } from "@/lib/db";
import LocalVault from "@/lib/vaults/local-vault";
import { CircleNotch, Folder } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useCallback, useState } from "react";

type VaultDetails = {
	name: string;
	rootHandle: FileSystemDirectoryHandle | null;
}

type LocalVaultFormProps = {
	/** The function to call to close the dialog after submit */
	closeDialog: () => void;
}

export default function LocalVaultForm({ closeDialog }: LocalVaultFormProps) {
	const queryClient = useQueryClient();

	const [vaultDetails, setVaultDetails] = useState<VaultDetails>({
		name: "",
		rootHandle: null,
	});
	const [nameError, setNameError] = useState<string>("");
	const [handleError, setHandleError] = useState<string>("");

	const { mutate, isPending } = useMutation({
		mutationFn: (vaultDetails: Omit<SavedVault, "id">) => LocalVault.saveNewVault(vaultDetails),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vaults"] });
			closeDialog();
		}
	});

	const openFolderPicker = async () => {
		const dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
		setVaultDetails((old) => ({ ...old, rootHandle: dirHandle }));
	};

	const handleSubmit = useCallback(
		(event: FormEvent) => {
			setNameError("");
			setHandleError("");
			event.preventDefault();

			if (vaultDetails.name.length <= 0 || vaultDetails.name.length > 100) {
				setNameError("A name of max. 100 characters must be supplied");
				return;
			}
			if (vaultDetails.rootHandle === null) {
				setHandleError("A folder must be supplied");
				return;
			}

			mutate(vaultDetails as Omit<SavedVault, "id">);
		},
		[vaultDetails]
	);

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="w-full space-y-1.5">
				<Label htmlFor="vault-type">Name</Label>
				<Input
					name="vaultName"
					value={vaultDetails.name}
					onChange={(e) =>
						setVaultDetails((old) => ({ ...old, name: e.target.value }))
					}
					required
				/>
				{nameError && <p className="text-red-400 text-sm">{nameError}</p>}
			</div>
			<div className="w-full space-y-1.5">
				<Label htmlFor="vault-type">Target folder</Label>
				<Button
					id="vault-type"
					className="flex w-full"
					type="button"
					variant="outline"
					onClick={openFolderPicker}
				>
					<Folder />
					{vaultDetails.rootHandle === null
						? "Choose a folder"
						: vaultDetails.rootHandle.name}
				</Button>
				{handleError && <p className="text-red-400 text-sm">{handleError}</p>}
			</div>
			<DialogFooter>
				<Button disabled={isPending}>
					{isPending ? <CircleNotch /> : <></>}
					Save
				</Button>
			</DialogFooter>
		</form>
	);
}
