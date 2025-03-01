import marked from "@/lib/marked";

/**
 * Widget to render inline HTML.
 * @param code The HTML code to render
 * @param styleClasses The style classes to apply if the inline HTML is inside some other decorations
 */
export default function html(code: string, styleClasses: string[]) {
	return () => {
		const html = document.createElement("span");
		html.innerHTML = marked.parseInline(code, { async: false });
		html.classList.add(...styleClasses);
		return html;
	};
}
