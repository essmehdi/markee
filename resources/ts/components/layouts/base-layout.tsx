import { IconContext } from "@phosphor-icons/react";
import { PropsWithChildren } from "react";

export default function BaseLayout({ children }: PropsWithChildren) {
	return (
		<IconContext.Provider value={{ weight: "bold", size: 18 }}>
			{children}
		</IconContext.Provider>
	);
}
