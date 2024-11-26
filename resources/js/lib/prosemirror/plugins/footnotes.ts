import { Node } from "prosemirror-model";
import { NodeSelection, Plugin } from "prosemirror-state";
import mdSchema from "../editor-schema";

type Footnote = {
	label: string;
	order: number;
};

const FOOTNOTE_REF_REGEX = /\[\^([^\s]+)\]/g;
const FOOTNOTE_STARTER = /^\s{0,3}\[\^([^\s]+)\]:/;

function getFootnotes(doc: Node): Footnote[] {
	const footnotes: Footnote[] = [];
	doc.descendants((node) => {
		if (node.type !== mdSchema.nodes.paragraph) {
			return true;
		}

		let m;
		while ((m = FOOTNOTE_REF_REGEX.exec(node.textContent))) {
			footnotes.push({
				label: m[1],
				order: footnotes.length + 1,
			});
		}
		return false;
	});
	return footnotes;
}

function findFootnote(doc: Node, label: string): number | null {
	let footnotePosition: number | null = null;
	doc.descendants((node, position) => {
		if (footnotePosition !== null) {
			return false;
		}
		if (node.type === mdSchema.nodes.paragraph) {
			const nodeText = node.textContent;
			const match = nodeText.match(FOOTNOTE_STARTER);
			if (match) {
				const matchLabel = match[1];
				if (matchLabel === label) {
					footnotePosition = position;
				}
			}
		}
		return false;
	});
	return footnotePosition;
}

const footnoter = new Plugin({
	props: {
		handleDOMEvents: {
			mousedown(_, event) {
				if (event.target instanceof HTMLElement) {
					const target = event.target;
					if (target.classList.contains("md-footnoteref")) {
						event.preventDefault();
						return true;
					}
				}
			},
			click(view, event) {
				if (event.target instanceof HTMLElement) {
					const target = event.target;
					if (target.classList.contains("md-footnoteref")) {
						event.preventDefault();
						const footnotePosition = findFootnote(view.state.doc, target.innerText);
						if (footnotePosition) {
							view.dispatch(
								view.state.tr.setSelection(NodeSelection.create(view.state.doc, footnotePosition))
							);
						}
						return true;
					}
				}
			},
		},
	},
});

export default footnoter;
