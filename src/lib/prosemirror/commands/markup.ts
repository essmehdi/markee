import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Markup, Position } from "~/lib/prosemirror/types";
import mdSchema from "~/lib/prosemirror/editor-schema";
import { selectionMarkupPosition } from "~/lib/prosemirror/plugins/parser";

/**
 * Returns a command that wraps the selection inside a punctuation string
 */
export function punctuationWrapperCommand(punctuation: string) {
  return (
    editorState: EditorState,
    dispatch?: EditorView["dispatch"]
  ): boolean => {
    if (dispatch) {
      const selection = editorState.selection;
      const wrappingPuncNode = mdSchema.text(punctuation);
      const transaction = editorState.tr;
      dispatch(
        transaction
          .insert(selection.from, wrappingPuncNode)
          .insert(selection.to + punctuation.length, wrappingPuncNode) // shifted due the first insert shift
          .setSelection(
            TextSelection.create(
              transaction.doc,
              selection.from + punctuation.length,
              selection.to + punctuation.length
            )
          )
      );
      return true;
    }
    return false;
  };
}

/**
 * Returns a command that delete ranges from the document
 */
export function removeRangesCommand(ranges: Position[]) {
  return (
    editorState: EditorState,
    dispatch?: EditorView["dispatch"]
  ): boolean => {
    let transaction = editorState.tr;
    if (dispatch && ranges.length) {
      let lastRange: Position | null = null;
      ranges.forEach((range) => {
        let correctedRange = range;
        if (lastRange) {
          const lastRangeDiff = lastRange[1] - lastRange[0];
          correctedRange = [range[0] - lastRangeDiff, range[1] - lastRangeDiff];
        }
        transaction = transaction.deleteRange(...correctedRange);
        lastRange = range;
      });
      dispatch(transaction);
      return true;
    }
    return false;
  };
}

export function toggleBasicMarkup(
  markupType: Markup["type"],
  punctuation: string
) {
  return function (
    editorState: EditorState,
    dispatch?: EditorView["dispatch"]
  ) {
    const markup = selectionMarkupPosition(editorState, markupType);
    const command = markup
      ? removeRangesCommand(markup.punctuation)
      : punctuationWrapperCommand(punctuation);
    return command(editorState, dispatch);
  };
}
