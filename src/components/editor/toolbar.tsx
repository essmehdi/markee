import MainToolbar from "./main-toolbar";
import TableToolbar from "./node-widgets/table-toolbar";

export default function Toolbar() {
	return (
		<div className="sticky z-[1] top-0 @6xl/main:top-5 @6xl/main:mt-10 mb-5">
			<MainToolbar />
			<TableToolbar />
		</div>
	)
}