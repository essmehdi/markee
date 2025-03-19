import DirectoryPicker from "~/components/editor/main-toolbar/menu/save-as/directory-picker";
import VaultSelectItem from "~/components/editor/vault-manager/vault-select-item";
import { Button } from "~/components/ui/button";
import { DialogContent, DialogHeader } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import useVault from "~/hooks/vaults/use-vault";
import { getMarkdownFromDocAsync } from "~/lib/prosemirror/serialization/serializer";
import BrowserVault from "~/lib/vaults/browser-vault";
import { ConflictError } from "~/lib/vaults/errors";
import LocalVault from "~/lib/vaults/local-vault";
import { Vault, VaultDirectory } from "~/lib/vaults/types";
import { useEditorState } from "@nytimes/react-prosemirror";
import { Dialog, DialogTitle } from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Tree } from "react-arborist";

type SaveAsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function SaveAsDialog({
  open,
  onOpenChange,
}: SaveAsDialogProps) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [selectedDirectory, setSelectedDirectory] =
    useState<VaultDirectory | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const editorState = useEditorState();

  const {
    data: vaults,
    isLoading,
    error: vaultFetchError,
  } = useQuery({
    queryKey: ["vaults"],
    queryFn: async () => [
      ...(await LocalVault.getAllLocalVaultsFromIndexedDB()),
      ...(await BrowserVault.getAllBrowserVaults()),
    ],
  });

  const setSelectedVault = (vaultId: string) => {
    const vault = vaults!.find((vault) => vault.id === vaultId)!;
    setVault(vault);
  };

  const saveFile = () => {
    setError("");
    if (fileName.length === 0) {
      setError("Please specify a valid file name");
      return;
    }
    if (selectedDirectory === null) {
      setError("Please choose a directory");
      return;
    }
    let correctedFileName = fileName;
    if (
      !fileName.toLowerCase().endsWith(".txt") &&
      !fileName.toLowerCase().endsWith(".md")
    ) {
      correctedFileName = fileName + ".md";
    }

    setIsSaving(true);
    vault
      ?.createFile(selectedDirectory, fileName)
      .then((file) => {
        getMarkdownFromDocAsync(editorState)
          .then((serialized) => {
            vault
              .writeToFile(file, serialized)
              .then(() => onOpenChange(false))
              .catch((e) => setError("An error occured while writing to file"))
              .finally(() => setIsSaving(false));
          })
          .catch(() => {
            setError("An error occured while serializing file");
          });
      })
      .catch((e: ConflictError) => {
        setIsSaving(false);
        setError(e.message);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose where to save</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <Select
            value={vault?.id ?? undefined}
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
                  <VaultSelectItem vault={vault} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {vault && (
            <>
              <DirectoryPicker vault={vault} onSelect={setSelectedDirectory} />
              <Input
                name="file-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </>
          )}
          <div className="space-y-2">
            <p
              data-visible={error !== ""}
              className="text-destructive-foreground data-[visible=true]:invisible"
            >
              {error}
            </p>
            <Button
              className="h-full"
              disabled={selectedDirectory === null}
              onClick={saveFile}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
