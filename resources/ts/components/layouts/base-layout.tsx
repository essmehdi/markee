import { IconContext } from "@phosphor-icons/react";
import { PropsWithChildren } from "react";
import { TooltipProvider } from "../ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SidebarProvider } from "../ui/sidebar";
import { Toaster } from "../ui/toaster";

const queryClient = new QueryClient();

export default function BaseLayout({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<IconContext.Provider value={{ weight: "bold", size: 18 }}>
					<SidebarProvider>
						{children}
						<Toaster />
					</SidebarProvider>
				</IconContext.Provider>
			</TooltipProvider>
			<ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
		</QueryClientProvider>
	);
}
