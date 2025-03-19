import { useSidebar } from "~/components/ui/sidebar";
import { Toggle } from "~/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Files } from "@phosphor-icons/react";

export default function SidebarToggle() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Workaround for breaking props with `asChild` */}
        <div>
          <Toggle
            pressed={(isMobile && openMobile) || (!isMobile && open)}
            onMouseDown={toggleSidebar}
          >
            <Files />
          </Toggle>
        </div>
      </TooltipTrigger>
      <TooltipContent>Open vault manager</TooltipContent>
    </Tooltip>
  );
}
