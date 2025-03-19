import SaveAsDialog from "~/components/editor/main-toolbar/menu/save-as/save-as-dialog";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { useSourceManager } from "~/lib/store/source-manager";
import { useState } from "react";

export default function SaveAsMenuItem() {
  const currentSource = useSourceManager((state) => state.currentSource);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);

  const saveAs = () => {
    setShowSaveAsDialog(true);
  };

  return (
    <DropdownMenuItem onSelect={saveAs} disabled={currentSource !== null}>
      Save as
      <SaveAsDialog
        open={showSaveAsDialog}
        onOpenChange={setShowSaveAsDialog}
      />
    </DropdownMenuItem>
  );
}
