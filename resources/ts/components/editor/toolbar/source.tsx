import { getNodeHash } from "@/lib/prosemirror/serialization/hash";
import { useSourceManager } from "@/lib/store/source-manager";
import { useEditorState } from "@nytimes/react-prosemirror";
import { CaretDown } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";

const opacityAnimation = {
	transition: {
		duration: 0.2,
	},
	initial: {
		opacity: 0,
	},
	animate: {
		opacity: 1,
	},
	exit: {
		opacity: 0,
	},
};

/**
 * Component that displays the current source of the editor
 */
export default function Source() {
	const { currentSource, lastSaveHash, isLoadingSource } = useSourceManager();
	const state = useEditorState();

	const { data: isSaved } = useQuery({
		queryKey: ["doc-saved", lastSaveHash, state],
		queryFn: async () => {
			const contentHash = await getNodeHash(state.doc);
			return contentHash === lastSaveHash;
		},
		enabled: !!currentSource,
	});

	const fileName = currentSource?.filePath.split("/").pop() ?? "Draft";

	return (
		<div className="space-y-0 flex items-center gap-2">
			<div>
				<AnimatePresence>
					{currentSource && (
						<motion.p
							key={currentSource.vault.name}
							className={clsx("text-neutral-400 text-xs text-left -mb-0.5", {
								"h-0": !currentSource,
							})}
							{...opacityAnimation}
						>
							{currentSource?.vault.name ?? ""}
						</motion.p>
					)}
				</AnimatePresence>
				<div>
					<AnimatePresence initial={false} mode="wait">
						<motion.h1
							key={fileName}
							className="font-bold text-base text-left truncate"
							{...opacityAnimation}
						>
							{fileName}
							<span
								className={clsx("text-green-400 pl-2", {
									visible: !isLoadingSource && isSaved === false,
									invisible:
										isLoadingSource || isSaved === undefined || isSaved,
								})}
							>
								•
							</span>
						</motion.h1>
					</AnimatePresence>
				</div>
			</div>

			<CaretDown className="!size-3" />
		</div>
	);
}
