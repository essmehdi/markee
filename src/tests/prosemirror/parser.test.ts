import { expect, it, describe } from "vitest";
import markdownParser from "~/lib/prosemirror/plugins/parser";
import { Markup } from "~/lib/prosemirror/types";
import { setupEditor } from "./common";

type SimplePunctuationTest = {
  markdown: string;
  markup: Partial<Markup>;
  extraChecks?: (markups: Markup[]) => void;
};

const simplePunctuation: SimplePunctuationTest[] = [
  {
    markdown: "**bold**",
    markup: {
      type: "strong",
    },
  },
  {
    markdown: "*italic*",
    markup: {
      type: "em",
    },
  },
  {
    markdown: "~strikethrough~",
    markup: {
      type: "del",
    },
  },
  {
    markdown: "~~strikethrough~~",
    markup: {
      type: "del",
    },
  },
  {
    markdown: "# Heading",
    markup: {
      type: "heading",
      level: 1,
    },
  },
  {
    markdown: "## Heading",
    markup: {
      type: "heading",
      level: 2,
    },
  },
  {
    markdown: "### Heading",
    markup: {
      type: "heading",
      level: 3,
    },
  },
  {
    markdown: "#### Heading",
    markup: {
      type: "heading",
      level: 4,
    },
  },
  {
    markdown: "##### Heading",
    markup: {
      type: "heading",
      level: 5,
    },
  },
  {
    markdown: "###### Heading",
    markup: {
      type: "heading",
      level: 6,
    },
  },
  {
    markdown: "`inline code`",
    markup: {
      type: "codespan",
    },
  },
  {
    markdown: "``inline code``",
    markup: {
      type: "codespan",
    },
    extraChecks(markups) {
      expect(markups[0].punctuation[0][1] - markups[0].punctuation[0][0]).toBe(
        2
      );
    },
  },
  {
    markdown: "$\\int_0^1 x^2 dx$",
    markup: {
      type: "inlinemath",
      expression: "\\int_0^1 x^2 dx",
    },
  },
];

describe("Markup", () => {
  describe("Simple punctuation", () => {
    simplePunctuation.forEach(({ markdown, markup, extraChecks }) => {
      it(`should parse ${markdown}`, () => {
        const { editorView, cleanup } = setupEditor();

        editorView.dispatch(
          editorView.state.tr.insertText(
            markdown,
            editorView.state.selection.from
          )
        );

        const markups =
          markdownParser.getState(editorView.state)?.markups ?? [];

        expect(markups.length).toBe(1);
        Object.keys(markup).forEach((key) => {
          expect(markups[0][key as keyof Markup]).toBe(
            markup[key as keyof Markup]
          );
        });
        if (extraChecks) {
          extraChecks(markups);
        }

        cleanup();
      });
    });
  });

  describe("Complex punctuation", () => {
    it("should parse nested punctuation", () => {
      const { editorView, cleanup } = setupEditor();

      editorView.dispatch(
        editorView.state.tr.insertText(
          "**bold and *italic* text** and also some *italic ~with~ strike text*",
          editorView.state.selection.from
        )
      );

      const markups = markdownParser.getState(editorView.state)?.markups ?? [];

      expect(markups.length).toBe(4);
      expect(markups[0].type).toBe("em");
      expect(markups[1].type).toBe("strong");
      expect(markups[2].type).toBe("del");
      expect(markups[3].type).toBe("em");

      cleanup();
    });

    it("should ignore parsing nested punctuation of the same type", () => {
      const { editorView, cleanup } = setupEditor();

      editorView.dispatch(
        editorView.state.tr.insertText(
          "**bold and **nested bold** text**",
          editorView.state.selection.from
        )
      );

      const markups = markdownParser.getState(editorView.state)?.markups ?? [];

      expect(markups.length).toBe(1);
      expect(markups[0].type).toBe("strong");

      cleanup();
    });
  });
});
