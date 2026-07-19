import { auth } from "@/auth";
import { getDrawings } from "@/data/drawings";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const drawings = await getDrawings();
  const csv = toCsv(
    [
      "Project",
      "Drawing number",
      "Title",
      "Block",
      "Zone",
      "Discipline",
      "Drawing status",
      "Latest revision",
      "Revision status",
      "Risk",
    ],
    drawings.map((drawing) => {
      const latest = drawing.revisions[0];
      return [
        drawing.project.code,
        drawing.number,
        drawing.title,
        drawing.block,
        drawing.zone,
        drawing.discipline,
        drawing.status,
        latest?.revisionCode ?? "",
        latest?.status ?? "",
        latest?.riskLevel ?? "",
      ];
    }),
  );

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="drawingflow-drawings.csv"',
    },
  });
}

