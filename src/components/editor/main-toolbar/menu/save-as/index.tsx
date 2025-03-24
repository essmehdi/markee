import SaveAsDialog from "~/components/editor/main-toolbar/menu/save-as/save-as-dialog";
import { DropdownMenuItem } from "~/components/ui/dropdown-menu";
import { useSourceManager } from "~/lib/store/source-manager";
import { useState } from "react";
import { FloppyDisk, FloppyDiskBack } from "@phosphor-icons/react";
import useDialog from "~/lib/store/dialog-manager";
import { useEditorState } from "@nytimes/react-prosemirror";

export default function SaveAsMenuItem() {
  const currentSource = useSourceManager((state) => state.currentSource);
  const { showDialog } = useDialog();
  const editorState = useEditorState();

  const saveAs = () => {
    showDialog(<SaveAsDialog editorState={editorState} />);
  };

  return (
    <DropdownMenuItem onSelect={saveAs}>
      <FloppyDisk className="invisible" />
      Save as
    </DropdownMenuItem>
  );
}
