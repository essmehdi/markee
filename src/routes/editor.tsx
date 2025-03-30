import { createFileRoute } from '@tanstack/react-router'
import Editor from "~/components/editor";
import BaseLayout from "~/components/layouts/base-layout";
import BaseSidebar from "~/components/layouts/base-sidebar";
import { SidebarInset } from "~/components/ui/sidebar";

export const Route = createFileRoute('/editor')({
  component: EditorPage,
	ssr: false
})

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