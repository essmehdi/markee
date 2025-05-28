import { createFileRoute } from "@tanstack/react-router";
import Editor from "~/components/editor";
import BaseLayout from "~/components/layouts/base-layout";
import BaseSidebar from "~/components/layouts/base-sidebar";
import { SidebarInset } from "~/components/ui/sidebar";

const title = import.meta.env.VITE_APP_NAME;
const description = "A web-based Markdown editor with live preview";
const keywords = "markdown, editor, live preview, web-based, open source";

export const Route = createFileRoute("/")({
  component: EditorPage,
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "keywords", content: keywords },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:creator", content: "@mehdiessalehi" },
      { name: "twitter:site", content: "@mehdiessalehi" },
      { name: "og:type", content: "website" },
      { name: "og:title", content: title },
      { name: "og:description", content: description },
    ],
  }),
});

/**
 * Editor page
 */
function EditorPage() {
  return (
    <BaseLayout>
      <BaseSidebar />
      <SidebarInset className="@container/main w-full">
        <Editor />
      </SidebarInset>
    </BaseLayout>
  );
}
