import { Plugin, TextSelection } from "prosemirror-state";
import mdSchema from "../editor-schema";
import markdownDecorator from "./decorator";

const transformer = new Plugin({
	view() {
		return {
			update(view) {
				const parsingResult = markdownDecorator.getState(view.state);
				if (parsingResult) {
					let transaction = view.state.tr;
					let transformsCount = 0;
					parsingResult.htmlTransforms.forEach((transform) => {
						const node = view.state.doc.nodeAt(transform.position);
						if (node && node.type !== transform.targetType) {
							if (node.type === mdSchema.nodes.paragraph || node.type === mdSchema.nodes.html) {
								transaction = transaction.setNodeMarkup(transform.position, transform.targetType);
								transformsCount++;
							}
						}
					});
					if (transformsCount > 0) {
						const currentSelection = view.state.selection;
						transaction = transaction.setSelection(
							TextSelection.create(transaction.doc, currentSelection.anchor, currentSelection.head)
						);
						view.dispatch(transaction);
					}
				}
			},
		};
	},
});

export default transformer;
