import { marked, TokenizerAndRendererExtension } from "marked";

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
};

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
};

marked.use({ extensions: [footnoteRef, inlineMath] });

export default marked;
