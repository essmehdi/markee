import { Button } from "~/components/ui/button";
import { DialogFooter } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import BrowserVault from "~/lib/vaults/browser-vault";
import { CircleNotch } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useCallback, useState } from "react";

type VaultDetails = {
  name: string;
};

type BrowserVaultFormProps = {
  /** The function to call to close the dialog after submit */
  closeDialog: () => void;
};

export default function BrowserVaultForm({
  closeDialog,
}: BrowserVaultFormProps) {
  const queryClient = useQueryClient();

  const [vaultDetails, setVaultDetails] = useState<VaultDetails>({
    name: "",
  });
  const [nameError, setNameError] = useState<string>("");

  const { mutate, isPending } = useMutation({
    mutationFn: (name: string) => BrowserVault.saveNewVault(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaults"] });
      closeDialog();
    },
  });

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      setNameError("");
      event.preventDefault();

      if (vaultDetails.name.length <= 0 || vaultDetails.name.length > 100) {
        setNameError("A name of max. 100 characters must be supplied");
        return;
      }

      mutate(vaultDetails.name);
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
        {nameError && <p className="text-sm text-red-400">{nameError}</p>}
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
