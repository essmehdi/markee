import mdSchema from "~/lib/prosemirror/editor-schema";
import markdownParser from "~/lib/prosemirror/plugins/parser";
import type { Link, Markup, Position } from "~/lib/prosemirror/types";
import html from "~/lib/prosemirror/widgets/html-widget";
import image from "~/lib/prosemirror/widgets/image-widget";
import inlineMathWidget from "~/lib/prosemirror/widgets/inline-math-widget";
import { EditorState, Plugin, PluginKey, Selection } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

/** Map for each markup to the its decorations handler that provides ProseMirror decorations */
type MarkupDecorationHandlers = {
  [K in Markup["type"]]: (
    markup: Extract<Markup, { type: K }>,
    ...args: any[]
  ) => Decoration[];
};

/**
 * Generic decorator for simple decorations like bold, italic, etc.
 * where there is simple styling.
 */
function styleDecorator(markup: Markup): Decoration[] {
  const decorationsArray = [];
  if (markup.punctuation.length > 0) {
    const decoClass = `md-${markup.type}`;
    decorationsArray.push(
      Decoration.inline(
        markup.punctuation[0][1],
        markup.punctuation[1]?.[0] ?? markup.context[1],
        {
          class: decoClass,
        },
        { markup }
      )
    );
  }

  return decorationsArray;
}

function punctuationDecorator(markup: Markup): Decoration[] {
  const decorationsArray: Decoration[] = [];
  markup.punctuation.forEach((punctuation) => {
    let punctuationClass = "md-punctuation";
    if (markup.type === "html") {
      punctuationClass += " md-" + markup.type;
    }
    decorationsArray.push(
      Decoration.inline(
        punctuation[0],
        punctuation[1],
        {
          class: "md-hidden",
        },
        {
          markup,
          toggleWhenCursorNear: true,
          deco: Decoration.inline(
            punctuation[0],
            punctuation[1],
            {
              class: punctuationClass,
            },
            { markup }
          ),
        }
      )
    );
  });
  return decorationsArray;
}

function genericDecorator(markup: Markup): Decoration[] {
  return [...styleDecorator(markup), ...punctuationDecorator(markup)];
}

/**
 * Map that provides decorations handler for each markup type. The callbacks return
 * the ProseMirror decorations to be displyed in the editor.
 */
const DECORATIONS_MAP: MarkupDecorationHandlers = {
  em: genericDecorator,
  strong: genericDecorator,
  del: genericDecorator,
  heading: (markup) => {
    const decorationsArray = [];
    if (markup.punctuation.length > 0) {
      const decoClass = `md-title-${markup.level} md-title`;
      decorationsArray.push(
        Decoration.inline(
          markup.punctuation[0][1],
          markup.punctuation[1]?.[0] ?? markup.context[1],
          {
            class: decoClass,
          },
          { markup }
        )
      );
    }

    markup.punctuation.forEach((punctuation) => {
      let punctuationClass = `md-punctuation md-title-${markup.level} md-title`;
      decorationsArray.push(
        Decoration.inline(
          punctuation[0],
          punctuation[1],
          {
            class: "md-hidden",
            level: markup.level.toString(),
          },
          {
            markup,
            toggleWhenCursorNear: true,
            deco: Decoration.inline(
              punctuation[0],
              punctuation[1],
              {
                class: punctuationClass,
                level: markup.level.toString(),
              },
              { markup }
            ),
          }
        )
      );
    });

    return decorationsArray;
  },
  codespan: genericDecorator,
  footnoteref: genericDecorator,
  link: (markup, contentEditable = true) => {
    const decorationsArray = [...punctuationDecorator(markup)];
    if (markup.punctuation.length > 0) {
      decorationsArray.push(
        Decoration.inline(
          markup.punctuation[1][1],
          markup.punctuation[2][0],
          {
            class: "md-hidden",
          },
          { markup, toggleWhenCursorNear: true }
        )
      );
    }
    const decorationRange: Position =
      markup.punctuation.length === 0
        ? markup.context
        : [markup.punctuation[0][1], markup.punctuation[1][0]];
    decorationsArray.push(
      Decoration.inline(
        decorationRange[0],
        decorationRange[1],
        {
          nodeName: "a",
          class: "md-link",
          href: markup.href,
          title: markup.title ?? undefined,
          contentEditable: "false",
        },
        {
          markup,
          toggleWhenCursorNear: true,
          deco: Decoration.inline(
            markup.punctuation[0][1],
            markup.punctuation[1][0],
            {
              nodeName: "a",
              class: "md-link",
              href: markup.href,
              title: markup.title ?? undefined,
            },
            { markup }
          ),
        }
      )
    );
    return decorationsArray;
  },
  image: (markup) => {
    const decorationArray = [...punctuationDecorator(markup)];
    decorationArray.push(
      Decoration.inline(
        markup.punctuation[1][1],
        markup.punctuation[2][0],
        {
          class: "md-hidden",
        },
        { markup, toggleWhenCursorNear: true }
      )
    );
    decorationArray.push(
      Decoration.inline(
        markup.punctuation[0][1],
        markup.punctuation[1][0],
        {
          class: "md-hidden",
        },
        { markup, toggleWhenCursorNear: true }
      )
    );
    decorationArray.push(
      Decoration.widget(
        markup.context[0],
        image(markup.url, markup.alt, markup.title),
        {
          key: `${markup.url}-${markup.alt}-${markup.title}`,
          markup,
          toggleWhenCursorNear: true,
        }
      )
    );
    return decorationArray;
  },
  inlinemath: (markup) => {
    const decorationsArray = [...punctuationDecorator(markup)];
    decorationsArray.push(
      Decoration.inline(
        markup.punctuation[0][1],
        markup.punctuation[1][0],
        {
          class: "md-hidden",
        },
        {
          markup,
          toggleWhenCursorNear: true,
          deco: Decoration.inline(
            markup.punctuation[0][1],
            markup.punctuation[1][0],
            {
              class: "md-inlinemath",
            },
            { markup }
          ),
        }
      )
    );
    decorationsArray.push(
      Decoration.widget(
        markup.punctuation[0][1],
        inlineMathWidget(markup.expression),
        {
          key: markup.expression,
          markup,
          toggleWhenCursorNear: true,
        }
      )
    );
    return decorationsArray;
  },
  html: (markup) => {
    const decorationsArray = [...punctuationDecorator(markup)];
    const styleClasses = markup.decorations.reduce(
      (acc, type) =>
        ["em", "strong", "del", "codespan"].includes(type)
          ? acc.concat(`md-${type}`)
          : acc,
      [] as string[]
    );
    decorationsArray.push(
      Decoration.inline(
        markup.context[0],
        markup.context[1],
        {
          class: "md-hidden",
        },
        { markup, toggleWhenCursorNear: true }
      )
    );
    decorationsArray.push(
      Decoration.widget(markup.context[0], html(markup.code, styleClasses), {
        markup,
        toggleWhenCursorNear: true,
      })
    );
    return decorationsArray;
  },
};

function getDecorationSet(state: EditorState): DecorationSet {
  const decorationsArray: Decoration[] = [];
  markdownParser.getState(state)?.markups.forEach((markup) => {
    const handler = DECORATIONS_MAP[markup.type];
    if (handler) {
      // @ts-ignore
      decorationsArray.push(...handler(markup));
    }
  });
  return DecorationSet.create(state.doc, decorationsArray);
}

function updateDecorations(
  state: EditorState,
  decSet: DecorationSet
): DecorationSet {
  const selection = state.selection;
  const selectedBlockStart = selection.$from.node().type.spec.isCell
    ? selection.$from.before()
    : selection.$from.before(1);
  const selectedBlockEnd = selection.$to.node().type.spec.isCell
    ? selection.$to.after()
    : selection.$to.after(1);

  const hiddenDecs = decSet.find(
    selectedBlockStart,
    selectedBlockEnd,
    (spec) => {
      const selectionNear = isSelectionNear(selection, spec.markup.context);
      return spec.toggleWhenCursorNear && selectionNear;
    }
  );

  decSet = decSet.add(
    state.doc,
    hiddenDecs
      .filter((dec) => dec.spec.deco)
      .map((dec) => {
        return dec.spec.deco;
      })
  );

  decSet = decSet.remove(hiddenDecs);
  return decSet;
}

function isSelectionNear(selection: Selection, context: Position): boolean {
  return (
    (selection.anchor <= context[1] && selection.anchor >= context[0]) ||
    (selection.head <= context[1] && selection.head >= context[0]) ||
    (selection.anchor <= context[0] && selection.head >= context[1]) ||
    (selection.head <= context[0] && selection.anchor >= context[1])
  );
}

const decorator = new Plugin({
  key: new PluginKey("decorator"),
  state: {
    init(_, initialState) {
      return getDecorationSet(initialState);
    },
    apply(tr, old, _, newState) {
      if (tr.docChanged) {
        return getDecorationSet(newState);
      }
      return old;
    },
  },
});

const decorationManager = new Plugin({
  key: new PluginKey("decoration-manager"),
  state: {
    init(_, initialState) {
      return updateDecorations(
        initialState,
        decorator.getState(initialState) ?? DecorationSet.empty
      );
    },
    apply(tr, old, oldState, newState) {
      if (
        oldState.selection.from === newState.selection.from &&
        oldState.selection.to === newState.selection.to
      ) {
        return old;
      } else {
        return updateDecorations(
          newState,
          decorator.getState(newState) ?? DecorationSet.empty
        );
      }
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
});

export { decorator, decorationManager };
