import { AttributeSpec, Attrs, Node, Schema } from "prosemirror-model";
import { bulletList, listItem, orderedList } from "prosemirror-schema-list";

const cellAttrs: Record<string, AttributeSpec> = {
	colspan: { default: 1 },
	rowspan: { default: 1 },
	colwidth: { default: null },
};

function getCellAttrs(dom: HTMLElement | string, extraAttrs: Attrs): Attrs {
	if (typeof dom === "string") {
		return {};
	}

	const widthAttr = dom.getAttribute("data-colwidth");
	const widths = widthAttr && /^\d+(,\d+)*$/.test(widthAttr) ? widthAttr.split(",").map((s) => Number(s)) : null;
	const colspan = Number(dom.getAttribute("colspan") || 1);
	const result = {
		colspan,
		rowspan: Number(dom.getAttribute("rowspan") || 1),
		colwidth: widths && widths.length == colspan ? widths : null,
	};
	for (const prop in extraAttrs) {
		const getter = extraAttrs[prop].getFromDOM;
		const value = getter && getter(dom);
		if (value != null) {
			result[prop as keyof typeof result] = value;
		}
	}
	return result;
}

function setCellAttrs(node: Node, extraAttrs: Attrs): Attrs {
	const attrs: Record<string, string> = {};
	if (node.attrs.colspan != 1) attrs.colspan = node.attrs.colspan;
	if (node.attrs.rowspan != 1) attrs.rowspan = node.attrs.rowspan;
	if (node.attrs.colwidth) attrs["data-colwidth"] = node.attrs.colwidth.join(",");
	for (const prop in extraAttrs) {
		const setter = extraAttrs[prop].setDOMAttr;
		if (setter) setter(node.attrs[prop], attrs);
	}
	return attrs;
}

const sharedBlockAttrs = {
	// extendsPrevious: { default: false }
};

// TODO: Organize this in different files
const mdSchema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: {
			group: "block",
			content: "inline*",
			attrs: {
				...sharedBlockAttrs,
			},
		},
		code: {
			group: "block",
			content: "text*",
			defining: true,
			attrs: {
				language: { default: "", validate: "string" },
				...sharedBlockAttrs,
			},
			isolating: true,
			code: true,
		},
		soft_break: {
			inline: true,
			group: "inline",
			selectable: false,
			toDOM() {
				return ["br"];
			},
		},
		bullet_list: {
			group: "block",
			content: "list_item+",
			...bulletList,
		},
		ordered_list: {
			group: "block",
			content: "list_item+",
			...orderedList,
		},
		list_item: {
			content: "block+",
			...listItem,
			attrs: {
				checked: {
					default: null,
					validate(value) {
						return value === null || typeof value === "boolean";
					},
				},
			},
			toDOM(node) {
				return [
					"li",
					{
						class: typeof node.attrs.checked !== "boolean" ? "md-list-item" : "md-checklist-item",
						checked: node.attrs.checked,
					},
					0,
				];
			},
		},
		// soft_break: {
    //   inline: true,
    //   group: "inline",
    //   selectable: false,
    //   parseDOM: [{tag: "br"}],
    //   toDOM() { return ["br"] }
    // },
		html: {
			content: "inline*",
			group: "block",
			code: true,
		},
		table: {
			content: "table_row table_row table_row*",
			tableRole: "table",
			isolating: true,
			group: "block",
			parseDOM: [{ tag: "table" }],
			toDOM() {
				return ["table", ["tbody", 0]];
			},
		},
		table_row: {
			content: "(table_cell | table_header)*",
			tableRole: "row",
			parseDOM: [{ tag: "tr" }],
			toDOM() {
				return ["tr", 0];
			},
		},
		table_cell: {
			content: "inline*",
			attrs: cellAttrs,
			tableRole: "cell",
			isolating: true,
			parseDOM: [{ tag: "td", getAttrs: (dom) => getCellAttrs(dom, {}) }],
			toDOM(node) {
				return ["td", setCellAttrs(node, {}), 0];
			},
		},
		table_header: {
			content: "inline*",
			attrs: cellAttrs,
			tableRole: "header_cell",
			isolating: true,
			parseDOM: [{ tag: "th", getAttrs: (dom) => getCellAttrs(dom, {}) }],
			toDOM(node) {
				return ["th", setCellAttrs(node, {}), 0];
			},
		},
		text: {
			group: "inline",
		},
	},
});

export default mdSchema;
