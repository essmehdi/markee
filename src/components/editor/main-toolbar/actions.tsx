import { Button } from "~/components/ui/button";
import { Toggle } from "~/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { insertHorizontalRule } from "~/lib/prosemirror/commands/blocks";
import { toggleBasicMarkup } from "~/lib/prosemirror/commands/markup";
import mdSchema from "~/lib/prosemirror/editor-schema";
import { toggleListItemCheckbox, wrapInTable } from "~/lib/prosemirror/keymap";
import { selectionMarkupPosition } from "~/lib/prosemirror/plugins/parser";
import { Markup } from "~/lib/prosemirror/types";
import {
  useEditorEventCallback,
  useEditorState,
} from "@nytimes/react-prosemirror";
import {
  Code,
  CodeBlock,
  Function,
  LineVertical,
  ListBullets,
  ListNumbers,
  Minus,
  Pi,
  Quotes,
  Table,
  TextBolder,
  TextItalic,
  TextStrikethrough,
} from "@phosphor-icons/react";
import { ListCheck } from "lucide-react";
import { setBlockType, wrapIn } from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Fragment } from "react/jsx-runtime";

type OptionWithId = {
  id: string;
  name: string;
  description: string;
};

type BaseToolbarAction = {
  id: string;
  type: string;
  shortcut?: string[];
};

interface Toggle extends BaseToolbarAction {
  type: "toggle";
  icon: React.JSX.Element;
  name: string;
  description: string;
  onClick: (view: EditorView) => void;
  getActiveMarkup: (view: EditorState) => Markup | null;
}

interface Dropdown extends BaseToolbarAction {
  type: "dropdown";
  options: OptionWithId[];
  onSelect: (view: EditorView, selected: OptionWithId) => void;
  selected: (view: EditorView) => OptionWithId;
}

interface Action extends BaseToolbarAction {
  type: "action";
  icon: React.JSX.Element;
  name: string;
  description: string;
  onClick: (view: EditorView) => void;
}

type ToolbarAction = Toggle | Dropdown | Action;

const ACTIONS: ToolbarAction[] = [
  {
    id: "toggle_bold",
    type: "toggle",
    icon: <TextBolder />,
    name: "Bold",
    description: "Makes the selection bold",
    onClick: (view) => {
      const toggleCommand = toggleBasicMarkup("strong", "**");
      toggleCommand(view.state, view.dispatch);
    },
    getActiveMarkup(state) {
      const result = selectionMarkupPosition(state, "strong");
      return result;
    },
    shortcut: ["Ctrl", "B"],
  },
  {
    id: "toggle_italic",
    type: "toggle",
    icon: <TextItalic />,
    name: "Italic",
    description: "Makes the selection italic",
    onClick: (view) => {
      const toggleCommand = toggleBasicMarkup("em", "*");
      toggleCommand(view.state, view.dispatch);
    },
    getActiveMarkup(state) {
      return selectionMarkupPosition(state, "em");
    },
    shortcut: ["Ctrl", "I"],
  },
  {
    id: "toggle_strike",
    type: "toggle",
    icon: <TextStrikethrough />,
    name: "Strikethrough",
    description: "Makes the selection strikethrough",
    onClick: (view) => {
      const toggleCommand = toggleBasicMarkup("del", "~~");
      toggleCommand(view.state, view.dispatch);
    },
    getActiveMarkup(state) {
      return selectionMarkupPosition(state, "del");
    },
    shortcut: ["Ctrl", "Shift", "X"],
  },
  {
    id: "toggle_inline_code",
    type: "toggle",
    icon: <Code />,
    name: "Inline code",
    description: "Makes the selection inline code",
    onClick: (view) => {
      const toggleCommand = toggleBasicMarkup("codespan", "`");
      toggleCommand(view.state, view.dispatch);
    },
    getActiveMarkup(state) {
      return selectionMarkupPosition(state, "codespan");
    },
    shortcut: ["Ctrl", "`"],
  },
  {
    id: "toggle_inline_math",
    type: "toggle",
    icon: <Pi />,
    name: "Inline math",
    description: "Makes the selection inline math",
    onClick: (view) => {
      const toggleCommand = toggleBasicMarkup("inlinemath", "$");
      toggleCommand(view.state, view.dispatch);
    },
    getActiveMarkup(state) {
      return selectionMarkupPosition(state, "inlinemath");
    },
    shortcut: ["Ctrl", "M"],
  },
  {
    id: "action_insert_unordered_list",
    type: "action",
    icon: <ListBullets />,
    name: "Unordered list",
    description: "Makes the selected block an unordered list",
    onClick: (view) => {
      wrapInList(mdSchema.nodes.bullet_list)(view.state, view.dispatch);
    },
    shortcut: ["Ctrl", "Shift", "L"],
  },
  {
    id: "action_insert_ordered_list",
    type: "action",
    icon: <ListNumbers />,
    name: "Ordered list",
    description: "Makes the selected block an ordered list",
    onClick: (view) => {
      wrapInList(mdSchema.nodes.ordered_list)(view.state, view.dispatch);
    },
    shortcut: ["Ctrl", "Shift", "O"],
  },
  {
    id: "action_insert_check_list",
    type: "action",
    icon: <ListCheck />,
    name: "Check list",
    description: "Makes the selected block an check list",
    onClick: (view) => {
      wrapInList(mdSchema.nodes.bullet_list)(view.state, view.dispatch);
      toggleListItemCheckbox(view.state, view.dispatch);
    },
  },
  {
    id: "action_insert_code_block",
    type: "action",
    icon: <CodeBlock />,
    name: "Code block",
    description: "Makes the selected block a code block",
    onClick: (view) => {
      setBlockType(mdSchema.nodes.code, { language: "" })(
        view.state,
        view.dispatch
      );
    },
    shortcut: ["Ctrl", "Shift", "K"],
  },
  {
    id: "action_insert_blockquote",
    type: "action",
    icon: <Quotes />,
    name: "Blockquote",
    description: "Makes the selected block a blockuote",
    onClick: (view) => {
      wrapIn(mdSchema.nodes.blockquote)(view.state, view.dispatch);
    },
  },
  {
    id: "action_insert_math_block",
    type: "action",
    icon: <Function />,
    name: "Math block",
    description: "Makes the selected block a math block",
    onClick: (view) => {
      setBlockType(mdSchema.nodes.math_block)(view.state, view.dispatch);
    },
  },
  {
    id: "action_insert_table",
    type: "action",
    icon: <Table />,
    name: "Table",
    description: "Makes the selected block a table",
    onClick: (view) => {
      wrapInTable(view.state, view.dispatch);
    },
  },
  {
    id: "action_insert_horizontal_rule",
    type: "action",
    icon: <Minus />,
    name: "Horizontal rule",
    description: "Inserts a horizontal rule",
    onClick: (view) => {
      insertHorizontalRule(view.state, view.dispatch);
    },
  },
];

export default function Actions() {
  const editorState = useEditorState();

  const applyAction = useEditorEventCallback(
    (
      view,
      actionCallback: (view: EditorView) => void,
      event: React.MouseEvent
    ) => {
      event.preventDefault();
      event.stopPropagation();
      actionCallback(view);
    }
  );

  const getToolbarActions = () => {
    const toggleGroup: React.JSX.Element[] = [];
    const actionGroup: React.JSX.Element[] = [];

    ACTIONS.forEach((action) => {
      if (action.type === "toggle") {
        toggleGroup.push(
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              {/* Workaround asChild props */}
              <div>
                <Toggle
                  pressed={action.getActiveMarkup(editorState) !== null}
                  onMouseDown={(event) => applyAction(action.onClick, event)}
                >
                  {action.icon}
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent
              className="flex flex-col items-center"
              side="bottom"
            >
              <p>{action.name}</p>
              {action.shortcut && (
                <div className="text-sm">
                  {action.shortcut?.map((key, index) => (
                    <Fragment key={key}>
                      {index !== 0 && "+"}
                      <kbd
                        key={key}
                        className="rounded-[0.3rem] bg-neutral-100 px-1"
                      >
                        {key}
                      </kbd>
                    </Fragment>
                  ))}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      } else if (action.type === "action") {
        actionGroup.push(
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                key={action.id}
                variant="ghost"
                size="icon"
                onMouseDown={(event) => applyAction(action.onClick, event)}
              >
                {action.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="flex flex-col items-center"
              side="bottom"
            >
              <p>{action.name}</p>
              {action.shortcut && (
                <div className="text-sm">
                  {action.shortcut?.map((key, index) => (
                    <Fragment key={key}>
                      {index !== 0 && "+"}
                      <kbd className="rounded-[0.3rem] bg-neutral-100 px-1">
                        {key}
                      </kbd>
                    </Fragment>
                  ))}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      }
    });

    return {
      toggles: toggleGroup,
      actions: actionGroup,
    };
  };

  const toolbarActions = getToolbarActions();
  return (
    <div id="editor-toolbar" className="flex items-center gap-1">
      {toolbarActions.toggles}
      <LineVertical className="text-neutral-200" size={10} />
      {toolbarActions.actions}
    </div>
  );
}
