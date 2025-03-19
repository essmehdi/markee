import { marked, Token } from "marked";
import { Markup } from "~/lib/prosemirror/types";

export type HTMLToken = {
  token: Token;
  afterContent: Token[];
  position: number;
  closing: boolean;
  decorations: string[];
  consumed: boolean;
};

const UNSUPPORTED_HTML_TAGS = [
  "input",
  "textarea",
  "form",
  "select",
  "option",
  "script",
  "style",
];
const SUPPORTED_HTML_TAGS = ["img", "br", "span", "summary", "details"];
const VOID_HTML_TAGS = ["br", "img", "hr"];

/**
 * Processes the HTML tokens found by the parser and returns the relevant markups
 *
 * @param tokens The HTML tokens found by the parser
 */
export function processHTMLTokens(tokens: HTMLToken[]): Markup[] {
  const markups: Markup[] = [];
  // Looping over the HTML tokens parsed
  for (let i = 0; i < tokens.length; i++) {
    const startingTag = tokens[i];

    // If it is not an opening tag, skip it
    if (startingTag.closing) {
      continue;
    }

    const match = startingTag.token.raw.match(/<([^\s]+)(?:\s|>)/)!;
    const startingTagName = match[1];

    let raw = [startingTag.token, ...startingTag.afterContent]; // Collect the content until we find the closing tag
    let found = false;
    // Look for the closing tag
    for (let j = i + 1; j < tokens.length; j++) {
      const tag = tokens[j];
      // Check if it matches the opening tag
      if (!tag.consumed && startingTagName === tag.token.raw.slice(2, -1)) {
        tag.consumed = true;
        raw = raw.concat(tag.token, tag.afterContent);

        // If the tag is a span, it will have the styles set, to be
        // considered as an inline decoration later.
        let style: string | null = null;
        if (startingTagName === "span") {
          const styleMatch = startingTag.token.raw.match(/style="([^"]*)"/);
          style = styleMatch?.[1] ?? "";
        }

        // When the closing tag is found, add it as an HTML markup.
        markups.push({
          type: "html",
          code: raw.reduce((acc, t) => acc + t.raw, ""),
          style: undefined,
          punctuation: [
            [
              startingTag.position,
              startingTag.position + startingTag.token.raw.length,
            ],
            [tag.position, tag.position + tag.token.raw.length],
          ],
          context: [startingTag.position, tag.position + tag.token.raw.length],
          decorations: startingTag.decorations,
        });
        found = true;
        i = j;
        break;
      } else {
        raw = raw.concat(tag.token, tag.afterContent);
      }
    }

    // If the tag is a void tag, push it directly since it does not need a closing tag
    if (!found && VOID_HTML_TAGS.includes(startingTagName)) {
      // 'marked' parser includes more text after line break even if there is no closing tag :/
      const correctedRaw = startingTag.token.raw.slice(
        0,
        startingTag.token.raw.indexOf(">") + 1
      );
      markups.push({
        type: "html",
        code: correctedRaw,
        punctuation: [
          [startingTag.position, startingTag.position + correctedRaw.length],
        ],
        context: [
          startingTag.position,
          startingTag.position + correctedRaw.length,
        ],
        decorations: startingTag.decorations,
      });
    }
  }
  return markups;
}
