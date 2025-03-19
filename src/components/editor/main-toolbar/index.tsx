import Actions from "./actions";
import Menu from "./menu";

export default function MainToolbar() {
	return (
		<div className="mx-auto w-full items-center gap-1 border-b border-neutral-100 bg-white p-1 text-neutral-700 shadow-md shadow-gray-100 @6xl/main:flex @6xl/main:w-11/12 @6xl/main:max-w-6xl @6xl/main:justify-between @6xl/main:rounded-[calc(theme(borderRadius.lg)+0.25rem)] @6xl/main:border">
			<Menu />
			<Actions />
		</div>
	);
}
