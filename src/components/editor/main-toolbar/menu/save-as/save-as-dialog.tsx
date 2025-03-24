import { useEditorState } from "@nytimes/react-prosemirror";
import { Check, CircleNotch } from "@phosphor-icons/react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorState } from "prosemirror-state";
import { useState } from "react";
import DirectoryPicker from "~/components/editor/main-toolbar/menu/save-as/directory-picker";
import VaultSelectItem from "~/components/editor/vault-manager/vault-select-item";
import { Button } from "~/components/ui/button";
import { DialogHeader } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getMarkdownFromDocAsync } from "~/lib/prosemirror/serialization/serializer";
import useDialog from "~/lib/store/dialog-manager";
import { useSourceManager } from "~/lib/store/source-manager";
import BaseLocalVault from "~/lib/vaults/base-local-vault";
import BrowserVault from "~/lib/vaults/browser-vault";
import { ConflictError } from "~/lib/vaults/errors";
import LocalVault from "~/lib/vaults/local-vault";
import { Vault, VaultDirectory } from "~/lib/vaults/types";

type SaveAsDialogProps = {
  editorState: EditorState;
};

export default function SaveAsDialog({ editorState }: SaveAsDialogProps) {
  const queryClient = useQueryClient();
  const changeCurrentSource = useSourceManager(
    (state) => state.changeCurrentSource
  );
  const setLastSaveState = useSourceManager((state) => state.setLastSaveState);
  const [vault, setVault] = useState<Vault | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<VaultDirectory>(
    BaseLocalVault.ROOT_DIRECTORY
  );
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const { closeDialog } = useDialog();

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
      ?.createFile(selectedDirectory, correctedFileName)
      .then((file) => {
        getMarkdownFromDocAsync(editorState)
          .then((serialized) => {
            vault
              .writeToFile(file, serialized)
              .then(() => {
                changeCurrentSource({ vault: vault, file });
                setLastSaveState(editorState);
                queryClient.invalidateQueries({
                  queryKey: ["vault", vault.id],
                });
                closeDialog();
              })
              .catch((e) => {
                console.error(e);
                setError("An error occured while writing to file");
              })
              .finally(() => setIsSaving(false));
          })
          .catch((e) => {
            console.error(e);
            setError("An error occured while serializing file");
          });
      })
      .catch((e: ConflictError) => {
        console.error(e);
        setIsSaving(false);
        setError(e.message);
      });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Choose where to save</DialogTitle>
      </DialogHeader>
      <div className="space-y-5">
        <Select value={vault?.id ?? undefined} onValueChange={setSelectedVault}>
          <SelectTrigger className="w-full">
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
            <DirectoryPicker
              className="w-full h-48"
              vault={vault}
              onSelect={setSelectedDirectory}
            />
            <div>
              <Label>File name</Label>
              <Input
                className="w-full"
                name="file-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
          </>
        )}
        <div className="space-y-2">
          {error !== "" && <p className="text-destructive text-sm">{error}</p>}
          <Button
            className="h-full"
            disabled={isSaving || vault === null || fileName === ""}
            onClick={saveFile}
          >
            {isSaving ? <CircleNotch className="animate-spin" /> : <Check />}
            Save
          </Button>
        </div>
      </div>
    </>
  );
}
