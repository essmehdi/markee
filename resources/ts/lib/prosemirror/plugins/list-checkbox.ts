import { Node } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import mdSchema from "@/lib/prosemirror/editor-schema";

function decorate(doc: Node) {
	const decorations: Decoration[] = [];

	doc.descendants((node, position) => {
		if (node.type === mdSchema.nodes.list_item) {
			if (node.attrs.checked !== null) {
				const checkBox = Decoration.widget(
					position + 1,
					(view, getPosition) => {
						const checkBoxInputContainer = document.createElement("div");
						checkBoxInputContainer.classList.add("md-checklist-item-checkbox");
						const checkBoxInput = document.createElement("input");
						checkBoxInput.type = "checkbox";
						checkBoxInput.checked = node.attrs.checked;
						checkBoxInput.addEventListener("change", (event) => {
							const itemPosition = getPosition()!;
							const transaction = view.state.tr.setNodeMarkup(
								itemPosition - 1,
								null,
								{
									checked: (event.target as HTMLInputElement).checked,
								}
							);
							view.dispatch(transaction);
						});
						checkBoxInputContainer.append(checkBoxInput);
						return checkBoxInputContainer;
					}
				);
				decorations.push(checkBox);
			}
		}

		return (
			node.type === mdSchema.nodes.bullet_list ||
			node.type === mdSchema.nodes.ordered_list ||
			node.type === mdSchema.nodes.list_item
		);
	});

	return DecorationSet.create(doc, decorations);
}

const listItemDecorator = new Plugin({
	state: {
		init(_, { doc }) {
			return decorate(doc);
		},
		apply(tr) {
			return decorate(tr.doc);
		},
	},
	props: {
		decorations(state) {
			return this.getState(state);
		},
	},
});

export default listItemDecorator;
