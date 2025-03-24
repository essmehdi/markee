import marked from "~/lib/marked";
import mdSchema from "~/lib/prosemirror/editor-schema";
import type { Markup, Position } from "~/lib/prosemirror/types";
import { Token } from "marked";
import { Node, NodeType, ResolvedPos } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { HTMLToken, processHTMLTokens } from "./html-processor";
import { processTokenForRanges } from "./tokens-processor";
import { DecorationSet } from "prosemirror-view";

type PluginState = {
  decorations: DecorationSet;
  result: ParsingResult;
};

type Transform = {
  targetType: NodeType;
  token?: Token; // Necessary if the transformation needs info from the token
  position: number;
};

export type ParsingResult = {
  markups: Markup[];
  htmlTransforms: Transform[];
};
const EMPTY_RESULT: ParsingResult = { markups: [], htmlTransforms: [] };

function nodeDescendantsParser(
  markups: Markup[],
  transforms: Transform[],
  node: Node,
  position: number,
  parent: Node | null
): boolean {
  if (
    node.type === mdSchema.nodes.blockquote ||
    node.type === mdSchema.nodes.bullet_list ||
    node.type === mdSchema.nodes.ordered_list ||
    node.type === mdSchema.nodes.list_item ||
    node.type === mdSchema.nodes.table ||
    node.type === mdSchema.nodes.table_row
  ) {
    return true;
  }

  if (
    node.type !== mdSchema.nodes.paragraph &&
    node.type !== mdSchema.nodes.table_header &&
    node.type !== mdSchema.nodes.table_cell
  ) {
    return false;
  }

  /* The offset is to align the ProseMirror positions with the tokens
   * analyzer. ProseMirror positioning system includes also the html tags
   */
  const nodeText = node.textBetween(0, node.nodeSize - 2, null, (leaf) =>
    leaf.type === mdSchema.nodes.soft_break ? "\n" : ""
  );

  if (nodeText.length === 0) {
    return false;
  }

  const tokens = marked.lexer(nodeText);
  let cursor = position + 1;
  const htmlStack: HTMLToken[] = [];
  for (const token of tokens) {
    if (token.type === "space") {
      cursor += token.raw.length;
      continue;
    }
    // Transform blocks into appropriate nodes
    if (
      parent &&
      (parent.type === mdSchema.nodes.doc ||
        parent.type === mdSchema.nodes.list_item ||
        parent.type === mdSchema.nodes.blockquote)
    ) {
      if (token.type === "html" && node.type !== mdSchema.nodes.html) {
        transforms.push({ targetType: mdSchema.nodes.html, position, token });
      } else if (token.type === "table" && node.type !== mdSchema.nodes.table) {
        transforms.push({
          targetType: mdSchema.nodes.table,
          position: cursor,
          token,
        });
      } else if (
        token.type === "paragraph" &&
        node.type !== mdSchema.nodes.paragraph
      ) {
        transforms.push({
          targetType: mdSchema.nodes.paragraph,
          position,
          token,
        });
      }
    }
    const [newRanges, newPosition] = processTokenForRanges(
      token,
      cursor,
      [],
      htmlStack
    );
    markups.push(...newRanges);
    cursor = newPosition;
  }
  const htmlTokens = processHTMLTokens(htmlStack);
  markups.push(...htmlTokens);
  return false;
}

/**
 * Tokenize the markdown code and generate decorations for the tokens.
 *
 * Starts by grouping the paragraphs that have no multiline spaces
 * Then each of the grouped paragraphs are tokenized
 *
 * @param nodeEntry The current editor node to decorate
 */
function parse(node: Node): ParsingResult {
  const markups: Markup[] = [];
  const transforms: Transform[] = [];

  if (node.childCount === 0) {
    return EMPTY_RESULT;
  }

  node.descendants((node, position, parent) => {
    return nodeDescendantsParser(markups, transforms, node, position, parent);
  });

  return {
    markups: markups,
    htmlTransforms: transforms,
  };
}

const markdownParser = new Plugin({
  key: new PluginKey("parser"),
  state: {
    init(_, { doc }) {
      return parse(doc);
    },
    apply(tr, old, _, newState) {
      if (tr.docChanged) {
        const invalidRanges: Position[] = [];
        const newResults: ParsingResult[] = [];
        tr.steps.forEach((step) => {
          step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
            newState.doc.nodesBetween(
              newStart,
              newEnd,
              (node, position, parent) => {
                invalidRanges.push([position, position + (node.nodeSize - 2)]);
                const newResult: ParsingResult = {
                  markups: [],
                  htmlTransforms: [],
                };
                const result = nodeDescendantsParser(
                  newResult.markups,
                  newResult.htmlTransforms,
                  node,
                  position,
                  parent
                );
                newResults.push(newResult);
                return result;
              }
            );
          });
        });
        old = mapResult(tr, old);
        for (let i = 0; i < invalidRanges.length; i++) {
          const invalidRange = invalidRanges[i];
          old.markups = old.markups.filter(
            (markup) =>
              markup.context[0] < invalidRange[0] ||
              markup.context[0] > invalidRange[1]
          );
          old.htmlTransforms = old.htmlTransforms.filter(
            (markup) =>
              markup.position < invalidRange[0] ||
              markup.position > invalidRange[1]
          );
        }
        for (let i = 0; i < invalidRanges.length; i++) {
          const parsingResult = newResults[i];
          old.markups.push(...parsingResult.markups);
          old.htmlTransforms.push(...parsingResult.htmlTransforms);
        }
        return old;
      }
      return old;
    },
  },
});

function mapResult(tr: Transaction, result: ParsingResult): ParsingResult {
  return {
    markups: result.markups.map((markup) => ({
      ...markup,
      punctuation: markup.punctuation.map((punc) => [
        tr.mapping.map(punc[0]),
        tr.mapping.map(punc[1]),
      ]),
      context: [
        tr.mapping.map(markup.context[0]),
        tr.mapping.map(markup.context[1]),
      ],
    })),
    htmlTransforms: result.htmlTransforms.map((transform) => ({
      ...transform,
      position: tr.mapping.map(transform.position),
    })),
  };
}

/**
 * Gets the nearest markup that wraps the current selection.
 * Since the parser is sequential, the markups are supposed to be sorted by context start position.
 */
export function selectionMarkupPosition(
  editorState: EditorState,
  markupType: Markup["type"]
): Markup | null {
  const selection = editorState.selection;
  const markups = markdownParser.getState(editorState)?.markups ?? [];
  const filteredMarkups = markups.filter((markup) => {
    return (
      markup.context[0] <= selection.from &&
      markup.type === markupType &&
      markup.context[1] >= selection.to
    );
  });
  return filteredMarkups.pop() ?? null;
}

export default markdownParser;
