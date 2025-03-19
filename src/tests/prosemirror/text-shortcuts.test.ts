import mdSchema from "~/lib/prosemirror/editor-schema";
import { NodeType } from "prosemirror-model";
import { describe, expect, it } from "vitest";
import { setupEditor } from "./common";
import { TextSelection } from "prosemirror-state";

type TextShortcutTest = {
  markdown: string;
  targetNodeType: NodeType;
  targetNodeAttrs: Record<string, any>;
  ignoreSelection: boolean;
};

const textShortcutsTests: TextShortcutTest[] = [
  {
    markdown: "- ",
    targetNodeType: mdSchema.nodes.bullet_list,
    targetNodeAttrs: {},
    ignoreSelection: true,
  },
  {
    markdown: "2. ",
    targetNodeType: mdSchema.nodes.ordered_list,
    targetNodeAttrs: { order: 2 },
    ignoreSelection: true,
  },
  {
    markdown: "```python",
    targetNodeType: mdSchema.nodes.code,
    targetNodeAttrs: { language: "python" },
    ignoreSelection: false,
  },
  {
    markdown: "```",
    targetNodeType: mdSchema.nodes.code,
    targetNodeAttrs: { language: "" },
    ignoreSelection: false,
  },
  {
    markdown: "> ",
    targetNodeType: mdSchema.nodes.blockquote,
    targetNodeAttrs: {},
    ignoreSelection: true,
  },
  {
    markdown: "$$",
    targetNodeType: mdSchema.nodes.math_block,
    targetNodeAttrs: {},
    ignoreSelection: false,
  },
];

describe("Text shortcuts", () => {
  textShortcutsTests.forEach(
    ({
      markdown,
      targetNodeType: targetNode,
      targetNodeAttrs,
      ignoreSelection,
    }) => {
      it(`should create a ${targetNode.name} node with attrs ${JSON.stringify(
        targetNodeAttrs
      )} when typing ${markdown}`, () => {
        const { editorView, cleanup } = setupEditor();

        let transaction = editorView.state.tr.insertText(markdown);
        if (!ignoreSelection) {
          transaction = transaction.insert(
            editorView.state.selection.from + markdown.length,
            mdSchema.nodes.paragraph.createAndFill(
              null,
              mdSchema.text("Some content below")
            )!
          );
          transaction = transaction.setSelection(
            TextSelection.create(
              transaction.doc,
              editorView.state.selection.from + markdown.length + 2
            )
          );
        }
        editorView.dispatch(transaction);

        const firstNode = editorView.state.doc.nodeAt(0)!;

        expect(firstNode.type.name).toBe(targetNode.name);
        expect(firstNode.attrs).toEqual(targetNodeAttrs);

        cleanup();
      });
    }
  );
});
