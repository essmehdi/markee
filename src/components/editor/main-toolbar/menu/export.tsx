import { Export, FileMd } from "@phosphor-icons/react";
import { EditorState } from "prosemirror-state";
import { useCallback } from "react";
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/ui/dropdown-menu";
import { getMarkdownFromDocAsync } from "~/lib/prosemirror/serialization/serializer";

type ExportSubMenu = {
  editorState: EditorState;
};

/**
 * The export submenu component
 */
export default function ExportSubMenu({ editorState }: ExportSubMenu) {
  /**
   * Export the editor content to Markdown
   */
  const exportToMarkdown = useCallback(() => {
    getMarkdownFromDocAsync(editorState).then((code) => {
      const mdBlob = new Blob([code], { type: "text/markdown" });
      const mdBlobURL = URL.createObjectURL(mdBlob);

      const link = document.createElement("a");
      link.download = "exported.md";
      link.href = mdBlobURL;
      link.click();
      URL.revokeObjectURL(mdBlobURL);
    });
  }, [editorState]);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Export />
        Export
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem onSelect={exportToMarkdown}>
            <FileMd />
            Markdown
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
