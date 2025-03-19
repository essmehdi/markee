import { marked, MarkedToken, TokenizerAndRendererExtension } from "marked";

export type InlineMathToken = {
	type: "inlinemath";
	raw: string;
	expression: string;
};

export type MathBlockToken = {
	type: "mathblock";
	raw: string;
	code: string;
};

export type FootnoteRefToken = {
	type: "footnoteref";
	raw: string;
	label: string;
};

export type ExtraToken = InlineMathToken | MathBlockToken | FootnoteRefToken;
export type CustomMarkedToken = MarkedToken | ExtraToken;

/**
 * Adds support for inline math: $\sqrt{-1}=i$
 */
export const inlineMath: TokenizerAndRendererExtension = {
	name: "inlinemath",
	level: "inline",
	start(src) {
		return src.match(/\$/)?.index;
	},
	tokenizer(src) {
		const rule = /^\$([^$]+)\$/; // Regex for the complete token, anchor to string start
		const match = src.match(rule);
		if (match) {
			const token = {
				type: "inlinemath",
				raw: match[0],
				expression: match[1].trim(),
			};
			return token;
		}
	},
} as const;

/**
 * Adds support for footnotes references: [^1]
 */
export const footnoteRef: TokenizerAndRendererExtension = {
	name: "footnoteref",
	level: "inline",
	start(src) {
		return src.match(/\[/)?.index;
	},
	tokenizer(src) {
		const rule = /^\[\^([^\s]+)\]/; // Regex for the complete token, anchor to string start
		const match = src.match(rule);
		if (match) {
			const token = {
				type: "footnoteref",
				raw: match[0],
				label: match[1].trim(),
			};
			return token;
		}
	},
} as const;

/**
 * Adds support for math block: $$
 */
export const mathBlock: TokenizerAndRendererExtension = {
	name: "mathblock",
	level: "block",
	start(src) {
		return src.match(/\$\$/)?.index;
	},
	tokenizer(src) {
		const rule = /^\$\$\s*?\n(.+?)\n\$\$/;
		const match = rule.exec(src);
		if (match) {
			const token = {
				type: "mathblock",
				raw: match[0],
				code: match[1].trim(),
			};
			return token;
		}
	},
} as const;

marked.use({ extensions: [footnoteRef, inlineMath, mathBlock] });

export default marked;
