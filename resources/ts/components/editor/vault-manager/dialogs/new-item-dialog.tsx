import { Button } from "@/components/ui/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSourceManager } from "@/lib/store/source-manager";
import { VaultDirectory } from "@/lib/vaults/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

type NewItemDialogProps = {
	type: "file" | "directory";
	location: VaultDirectory;
	closeDialog: () => void;
};

export default function NewItemDialog({
	location,
	type,
	closeDialog,
}: NewItemDialogProps) {
	const queryClient = useQueryClient();
	const dialogTitle = type === "file" ? "New file" : "New directory";
	const dialogDescription =
		type === "file"
			? "Creates a new file in the selected directory"
			: "Creates a new directory in the selected directory";

	const currentSelection = useSourceManager((state) => state.currentSelection);

	const [error, setError] = useState<string>("");

	const { mutate: createItem } = useMutation({
		mutationFn: (itemName: string) =>
			type === "file"
				? currentSelection.vault!.createFile(location, itemName)
				: currentSelection.vault!.createDirectory(location, itemName),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["vault"] });
			closeDialog();
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	const createFile = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			const itemName = new FormData(event.currentTarget)
				.get("itemName")!
				.toString();
			if (!itemName) {
				setError("You must supply a name");
				return;
			}

			let correctedItemName = itemName;
			if (type === "file" && !correctedItemName.toLowerCase().endsWith(".md")) {
				correctedItemName += ".md";
			}
			createItem(correctedItemName);
		},
		[type],
	);

	return (
		<>
			<DialogHeader>
				<DialogTitle>{dialogTitle}</DialogTitle>
				<DialogDescription>{dialogDescription}</DialogDescription>
			</DialogHeader>
			<form className="space-y-4" onSubmit={createFile}>
				<div className="w-full space-y-1.5">
					<Label htmlFor="item-name">Name</Label>
					<Input id="item-name" name="itemName" required />
					{error && <p className="text-red-400 text-sm">{error}</p>}
				</div>
				<DialogFooter>
					<Button type="submit">Create</Button>
				</DialogFooter>
			</form>
		</>
	);
}
