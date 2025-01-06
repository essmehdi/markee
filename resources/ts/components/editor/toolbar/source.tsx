import { Source as SourceType } from "@/lib/store/source-manager";
import { CaretDown } from "@phosphor-icons/react";
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

type SourceProps = {
	saved: boolean | undefined;
	currentSource: SourceType | null;
};

/**
 * Component that displays the current source of the editor
 */
export default function Source({ saved, currentSource }: SourceProps) {
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
								className={clsx("text-primary pl-2", {
									visible: saved === false,
									invisible: saved || saved === undefined,
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
