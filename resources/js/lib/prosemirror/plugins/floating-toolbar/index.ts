import { Plugin } from "prosemirror-state";
import MenuView from "./menu-view";

const floatingToolbar = new Plugin({
	view(view) {
		const toolbar = new MenuView(view);
		view.dom.parentNode?.prepend(toolbar.dom);
		return toolbar;
	},
})

export default floatingToolbar;
