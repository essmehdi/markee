import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/ui/dropdown-menu";
import { browserPrint } from "~/lib/prosemirror/export/print";
import { getMarkdownFromDocAsync } from "~/lib/prosemirror/serialization/serializer";
import { useEditorEventCallback } from "@nytimes/react-prosemirror";
import { Export, FileMd, Printer } from "@phosphor-icons/react";
import { EditorState } from "prosemirror-state";
import { useCallback } from "react";

type ExportSubMenu = {
  editorState: EditorState;
};

/**
 * The export submenu component
 */
export default function ExportSubMenu({ editorState }: ExportSubMenu) {
  /**
   * Prints the editor content using the browser print feature
   */
  const printDocument = useEditorEventCallback((view) => {
    browserPrint(view);
  });

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
          <DropdownMenuItem onSelect={printDocument}>
            <Printer />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToMarkdown}>
            <FileMd />
            Markdown
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
