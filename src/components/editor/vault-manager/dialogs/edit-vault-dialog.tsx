import { Check } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Vault } from "~/lib/vaults/types";

type EditVaultDialogProps = {
  /** Vault to edit */
  vault?: Vault;
  /** The function to call to close the dialog after submit */
  closeDialog: () => void;
};

export default function EditVaultDialog({
  vault,
  closeDialog,
}: EditVaultDialogProps) {
  const queryClient = useQueryClient();
  const [vaultName, setVaultName] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (vault) {
      setVaultName(vault.name);
    }
  }, [vault]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (vaultName.length === 0) {
      setNameError("You must supply a name");
      return;
    }
    if (vault) {
      vault
        .rename(vaultName)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["vaults"] });
          closeDialog();
        })
        .catch((error) => {
          if (error instanceof Error) {
            setNameError(error.message);
          }
        });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit vault</DialogTitle>
        <DialogDescription>Change vault details</DialogDescription>
      </DialogHeader>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="w-full space-y-1.5">
          <Label htmlFor="vault-type">Name</Label>
          <Input
            name="vaultName"
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            required
          />
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
        </div>
        <div className="flex justify-end">
          <Button type="submit">
            <Check />
            Save
          </Button>
        </div>
      </form>
    </>
  );
}
