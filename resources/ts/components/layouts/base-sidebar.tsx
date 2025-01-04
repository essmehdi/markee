import VaultBrowser from "../editor/vault-manager";
import { Sidebar, SidebarContent, SidebarRail } from "../ui/sidebar";

export default function BaseSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <VaultBrowser />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}