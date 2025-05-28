import { createFileRoute } from "@tanstack/react-router";
import Editor from "~/components/editor";
import BaseLayout from "~/components/layouts/base-layout";
import BaseSidebar from "~/components/layouts/base-sidebar";
import { SidebarInset } from "~/components/ui/sidebar";

export const Route = createFileRoute("/")({
  component: EditorPage,
  ssr: false,
  head: () => ({
    meta: [
      {
        title: import.meta.env.VITE_APP_NAME,
        description: "A live preview web-based Markdown editor",
      },
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
