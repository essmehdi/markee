import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { List } from "@phosphor-icons/react";
import { memo } from "react";

function Menu() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
        <Button variant="ghost"><List />Menu</Button>
      </DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuItem>
					Open file
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export default memo(Menu);
