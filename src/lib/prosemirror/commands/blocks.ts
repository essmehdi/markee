import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import mdSchema from "~/lib/prosemirror/editor-schema";

export function insertHorizontalRule(
  editorState: EditorState,
  dispatch?: EditorView["dispatch"]
): boolean {
  if (editorState.selection.$from.parent.type !== mdSchema.nodes.paragraph) {
    return false;
  }
  dispatch?.(
    editorState.tr.replaceSelectionWith(
      mdSchema.nodes.horizontal_rule.createAndFill()!
    )
  );
  return true;
}
