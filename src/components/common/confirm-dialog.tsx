import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { CircleNotch } from "@phosphor-icons/react";

type ConfirmDialogProps<T = unknown> = {
	title: string;
	description?: string;
	positiveMessage: string;
	negativeMessage: string;
	action: () => Promise<T>;
	onPromiseResolve: (result: T) => void;
	onPromiseReject?: () => void;
	onPromiseFinally?: () => void;
};

export default function ConfirmDialog({
	title,
	description,
	positiveMessage,
	negativeMessage,
	action,
	onPromiseResolve,
	onPromiseReject,
	onPromiseFinally,
}: ConfirmDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const doAction = () => {
		setIsLoading(true);
		action()
			.then(onPromiseResolve)
			.catch(onPromiseReject)
			.finally(() => {
				setIsLoading(false);
				onPromiseFinally?.();
			});
	};

	return (
		<AlertDialog defaultOpen={true}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					{description && (
						<AlertDialogDescription>{description}</AlertDialogDescription>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{negativeMessage}</AlertDialogCancel>
					<AlertDialogAction onClick={doAction}>
						{ isLoading && <CircleNotch className="animate-spin" /> }
						{positiveMessage}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
