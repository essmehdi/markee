import jsPDF from "jspdf";
import regularFont from "~/lib/pdf/fonts/Figtree-Regular-normal";
import boldFont from "~/lib/pdf/fonts/Figtree-Bold-normal";
import regularMonoFont from "~/lib/pdf/fonts/IBMPlexMono-Regular-normal";
import boldMonoFont from "~/lib/pdf/fonts/IBMPlexMono-Bold-normal";

// const pdf = new jsPDF("p", "pt", "a4", true);
const pdf = new jsPDF({
  orientation: "portrait",
  unit: "px",
  hotfixes: ["px_scaling"],
  compress: true,
  format: "a4",
});

pdf
  .addFileToVFS("Figtree-Regular-normal.ttf", regularFont)
  .addFont("Figtree-Regular-normal.ttf", "Figtree", "normal", 400);

pdf
  .addFileToVFS("Figtree-Bold-normal.ttf", boldFont)
  .addFont("Figtree-Bold-normal.ttf", "Figtree", "normal", 700);

pdf
  .addFileToVFS("IBMPlexMono-Regular-normal.ttf", regularMonoFont)
  .addFont("IBMPlexMono-Regular-normal.ttf", "IBM Plex Mono", "normal", 400);

pdf
  .addFileToVFS("IBMPlexMono-Bold-normal.ttf", boldMonoFont)
  .addFont("IBMPlexMono-Bold-normal.ttf", "IBM Plex Mono", "normal", 700);

export default pdf;
