import { getSliceFromMarkdown } from "~/lib/prosemirror/serialization/deserializer";
import { Plugin } from "prosemirror-state";

const pasteHandler = new Plugin({
  props: {
    handlePaste(view, event) {
      const markdown = event.clipboardData?.getData("text/plain") ?? "";
      if (markdown) {
        view.dispatch(
          view.state.tr.replaceSelection(getSliceFromMarkdown(markdown))
        );
      }
      return true;
    },
  },
});

export default pasteHandler;
