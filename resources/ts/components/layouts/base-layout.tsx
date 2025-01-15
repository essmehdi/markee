import { CircleNotch, IconContext } from "@phosphor-icons/react";
import { PropsWithChildren, useState } from "react";
import { TooltipProvider } from "../ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SidebarProvider } from "../ui/sidebar";
import { Toaster } from "../ui/toaster";
import { Dialog, DialogContent } from "../ui/dialog";
import useDialog from "@/lib/store/dialog-manager";
import useConfirmationAlert from "@/lib/store/confirmation-alert-manager";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

const queryClient = new QueryClient();

export default function BaseLayout({ children }: PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<IconContext.Provider value={{ weight: "bold", size: 18 }}>
					<SidebarProvider>
						{children}
						<Toaster />
						<AlertManager />
						<DialogManager />
					</SidebarProvider>
				</IconContext.Provider>
			</TooltipProvider>
			<ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
		</QueryClientProvider>
	);
}

function AlertManager() {
	const { open, action, title, description, closeConfirmationAlert, _onChangeOpen } = useConfirmationAlert();
	const [isLoading, setIsLoading] = useState(false);

	const confirmAction = () => {
		const actionReturn = action?.();
		if (actionReturn instanceof Promise) {
			setIsLoading(true);
			actionReturn.finally(() => {
				closeConfirmationAlert();
				setIsLoading(false);
			});
		} else {
			closeConfirmationAlert();
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={_onChangeOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title ?? "Are you sure?"}</AlertDialogTitle>
					<AlertDialogDescription>{description ?? "This action is irreversible."}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={closeConfirmationAlert}>Cancel</AlertDialogCancel>
					<Button onClick={confirmAction}>
						{isLoading && <CircleNotch />}
						Confirm
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function DialogManager() {
	const { open, _onChangeOpen, content } = useDialog();
	return (
		<Dialog open={open} onOpenChange={_onChangeOpen}>
			<DialogContent>{content}</DialogContent>
		</Dialog>
	);
}
