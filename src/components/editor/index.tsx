import ImagePicker from "~/components/editor/node-widgets/image-picker";
import mdSchema from "~/lib/prosemirror/editor-schema";
import editorKeymap from "~/lib/prosemirror/keymap";
import {
  decorationManager,
  decorator,
} from "~/lib/prosemirror/plugins/decorator";
import footnoter from "~/lib/prosemirror/plugins/footnotes";
import listItemDecorator from "~/lib/prosemirror/plugins/list-checkbox";
import markdownParser from "~/lib/prosemirror/plugins/parser";
import pasteHandler from "~/lib/prosemirror/plugins/paste-handler";
import textShortcutPlugin from "~/lib/prosemirror/plugins/text-shortcuts";
import transformer from "~/lib/prosemirror/plugins/transformer";
import { getNewDocFromMarkdown } from "~/lib/prosemirror/serialization/deserializer";
import CodeBlockView from "~/lib/prosemirror/views/code-view";
import HTMLView from "~/lib/prosemirror/views/html-view";
import MathBlockView from "~/lib/prosemirror/views/math-block-view";
import useConfirmationAlert from "~/lib/store/confirmation-alert-manager";
import { useSourceManager } from "~/lib/store/source-manager";
import { ProseMirror } from "@nytimes/react-prosemirror";
import "katex/dist/katex.min.css";
import "prosemirror-gapcursor/style/gapcursor.css";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { tableEditing } from "prosemirror-tables";
import "prosemirror-tables/style/tables.css";
import { NodeViewConstructor } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import { useEffect, useRef, useState } from "react";
import "~/styles/editor.css";
import Toolbar from "./toolbar";
import { useToast } from "~/hooks/use-toast";
import { Node } from "prosemirror-model";

export const nodeViews: { [key: string]: NodeViewConstructor } = {
  code(node, view, getPos) {
    return new CodeBlockView(node, view, getPos, mdSchema);
  },
  html(node, view, getPos) {
    return new HTMLView(node, view, getPos, mdSchema);
  },
  math_block(node, view, getPos) {
    return new MathBlockView(node, view, getPos, mdSchema);
  },
};

export const editorPlugins = [
  history(),
  keymap(editorKeymap(mdSchema)),
  markdownParser,
  decorator,
  decorationManager,
  transformer,
  textShortcutPlugin,
  listItemDecorator,
  footnoter,
  tableEditing({ allowTableNodeSelection: true }),
  pasteHandler,
];

const AUTO_SAVE_DRAFT_INTERVAL = 2000;
const AUTO_SAVE_DRAFT_LOCAL_STORAGE_KEY = "draft";

// Retrieve auto saved draft doc from local storage
const localStorageSavedDoc = localStorage.getItem(AUTO_SAVE_DRAFT_LOCAL_STORAGE_KEY);
let savedDoc: Node | undefined = undefined;
if (localStorageSavedDoc) {
  try {
    savedDoc = Node.fromJSON(mdSchema, JSON.parse(localStorageSavedDoc))
  } catch (e) {
    console.error("Could not parse saved doc from local storage.", e);
  }
}

// Initialize editor state with empty draft or auto saved draft. 
export const editorInitialState = EditorState.create({
  schema: mdSchema,
  plugins: editorPlugins,
  doc: savedDoc
});

/**
 * Main editor component
 */
export default function Editor() {
  const {
    isCurrentSourceDeleted,
    isLoadingSource,
    currentSelection,
    currentSource,
    setIsLoadingSource,
    changeCurrentSource,
    changeCurrentSourceDeletedFlag,
    setLastSaveState,
    checkDocSavedState,
  } = useSourceManager();
  const { showConfirmationAlert } = useConfirmationAlert();
  const { toast } = useToast();

  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [editorState, setEditorState] =
    useState<EditorState>(editorInitialState);
  const draftAutoSaveTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  /**
   * Reads the selected file and sets it as the source of the
   * editor. Set the last save hash to the content of the file.
   */
  const loadSource = () => {
    const doLoadSource = () => {
      setIsLoadingSource(true);

      const { vault, file } = currentSelection;
      vault!
        .getFileContent(file!)
        .then((decodedFileContent) => {
          const doc = getNewDocFromMarkdown(decodedFileContent);
          const newEditorState = EditorState.create({
            schema: mdSchema,
            plugins: editorPlugins,
            doc,
          });

          changeCurrentSource({
            vault: vault!,
            file: file!,
          });

          setEditorState(newEditorState);
          setLastSaveState(newEditorState);
        })
        .catch((error) => {
          console.error("Could not open file", error);
          toast({
            title: "Could not open file",
            description: "An error occured while opening the file",
          });
          setLastSaveState(null);
        })
        .finally(() => {
          setIsLoadingSource(false);
        });
    };

    if (
      currentSelection.vault &&
      currentSelection.file &&
      (currentSelection.vault !== currentSource?.vault ||
        currentSelection.file !== currentSource?.file)
    ) {
      if (currentSource && !checkDocSavedState(editorState)) {
        showConfirmationAlert(
          doLoadSource,
          "Are you sure?",
          "This will replace the current document and all unsaved content will be lost and cannot be recovered. The history will be reset consequently."
        );
      } else {
        doLoadSource();
      }
    }
  };

  /**
   * Clears the editor when the current source is deleted.
   * Resets the flags after clearing.
   */
  const clearSource = () => {
    const newEditorState = EditorState.create({
      schema: mdSchema,
      plugins: editorPlugins,
    });
    setEditorState(newEditorState);
    setLastSaveState(null);
    changeCurrentSource(null);
    changeCurrentSourceDeletedFlag(false);
  };

  useEffect(() => {
    loadSource();
  }, [currentSelection]);

  useEffect(() => {
    if (isCurrentSourceDeleted) {
      clearSource();
    }
  }, [isCurrentSourceDeleted]);

  useEffect(() => {
    if (!currentSource) {
      if (draftAutoSaveTimeout.current) {
        clearTimeout(draftAutoSaveTimeout.current);
      }
      draftAutoSaveTimeout.current = setTimeout(() => {
        localStorage.setItem(
          AUTO_SAVE_DRAFT_LOCAL_STORAGE_KEY,
          JSON.stringify(editorState.doc.toJSON())
        );
      }, AUTO_SAVE_DRAFT_INTERVAL);
    }
  }, [editorState, currentSource]);

  return (
    <ProseMirror
      mount={mount}
      state={editorState}
      dispatchTransaction={(tr) => {
        setEditorState((oldState) => oldState.apply(tr));
      }}
      nodeViews={nodeViews}
      editable={() => !isLoadingSource}
    >
      <Toolbar />
      <ImagePicker />
      <div className="md-editor" ref={setMount} />
    </ProseMirror>
  );
}
