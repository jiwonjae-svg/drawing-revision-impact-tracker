import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed DrawingFlow.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const demoPassword = "Demo123!";
const baseDate = new Date("2026-07-15T00:00:00.000Z");

const users = [
  { id: "demo-designer", name: "Min Seo", email: "designer@drawingflow.demo", role: "DESIGNER" as const },
  { id: "demo-reviewer", name: "Aya Tanaka", email: "reviewer@drawingflow.demo", role: "REVIEWER" as const },
  { id: "demo-production", name: "Kenji Sato", email: "production@drawingflow.demo", role: "PRODUCTION" as const },
  { id: "demo-admin", name: "Daniel Kim", email: "admin@drawingflow.demo", role: "ADMIN" as const },
  { id: "demo-viewer", name: "Rina Mori", email: "viewer@drawingflow.demo", role: "VIEWER" as const },
];

const projects = [
  {
    id: "project-aurora",
    code: "DF-AUR",
    name: "Aurora Ro-Ro Vessel",
    vesselType: "Ro-Ro Cargo Vessel",
  },
  {
    id: "project-horizon",
    code: "DF-HZN",
    name: "Horizon Offshore Support",
    vesselType: "Offshore Support Vessel",
  },
];

const blocks = ["B101", "B102", "E201"];
const zones = ["PORT", "CENTER", "STBD", "ENGINE", "DECK-03"];
const disciplines = ["STRUCTURE", "OUTFITTING", "PIPING", "ELECTRICAL", "HVAC"] as const;
const disciplineCodes = {
  STRUCTURE: "STR",
  OUTFITTING: "OUT",
  PIPING: "PIP",
  ELECTRICAL: "ELE",
  HVAC: "HVA",
};
const titles = [
  "Deck support arrangement",
  "Longitudinal bulkhead detail",
  "Engine-room foundation layout",
  "Pipe support installation plan",
  "Cable tray routing arrangement",
  "Ventilation duct penetration detail",
  "Access platform assembly",
  "Watertight door interface",
  "Equipment seating detail",
  "Inspection access arrangement",
];
const processTargets = ["Cutting", "Assembly", "Welding", "Inspection", "Outfitting"];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function statusFor(drawingIndex: number, revisionIndex: number) {
  if (revisionIndex === 0) {
    return (["CLOSED", "ISSUED", "APPROVED"] as const)[drawingIndex % 3];
  }
  return (["DRAFT", "IN_REVIEW", "IN_REVIEW", "APPROVED", "ISSUED"] as const)[
    drawingIndex % 5
  ];
}

async function main() {
  const passwordHash = await hash(demoPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      "SELECT set_config('drawingflow.audit_bypass', 'on', true)",
    );
    await tx.notificationOutbox.deleteMany();
    await tx.auditEvent.deleteMany();
    await tx.acknowledgement.deleteMany();
    await tx.reviewRecord.deleteMany();
    await tx.revisionImpact.deleteMany();
    await tx.revision.deleteMany();
    await tx.drawing.deleteMany();
    await tx.importBatch.deleteMany();
    await tx.integrationSource.deleteMany();
    await tx.projectMembership.deleteMany();
    await tx.project.deleteMany();
    await tx.user.deleteMany();
  });

  await prisma.user.createMany({
    data: users.map((user) => ({ ...user, passwordHash })),
  });

  await prisma.project.createMany({ data: projects });

  await prisma.projectMembership.createMany({
    data: projects.flatMap((project) =>
      users
        .filter((user) => user.id !== "demo-viewer" || project.id === "project-aurora")
        .map((user) => ({
          projectId: project.id,
          userId: user.id,
          role: user.role,
        })),
    ),
  });

  await prisma.integrationSource.createMany({
    data: projects.flatMap((project) => [
      {
        projectId: project.id,
        name: `${project.code} drawing register CSV`,
        type: "CSV_IMPORT" as const,
        status: "READY",
        config: { requiredColumns: ["number", "title", "block", "zone", "discipline"] },
      },
      {
        projectId: project.id,
        name: `${project.code} PDM REST adapter`,
        type: "REST_PDM" as const,
        status: "DEMO_CONFIGURATION",
        config: { mode: "metadata-only", synthetic: true },
      },
    ]),
  });

  let drawingCount = 0;
  let revisionCount = 0;

  for (const [projectIndex, project] of projects.entries()) {
    for (let localIndex = 0; localIndex < 15; localIndex += 1) {
      const drawingIndex = projectIndex * 15 + localIndex;
      const discipline = disciplines[drawingIndex % disciplines.length];
      const block = blocks[drawingIndex % blocks.length];
      const drawing = await prisma.drawing.create({
        data: {
          projectId: project.id,
          number: `DEMO-${project.code.slice(3)}-${block}-${disciplineCodes[discipline]}-${String(localIndex + 1).padStart(3, "0")}`,
          title: titles[drawingIndex % titles.length],
          block,
          zone: zones[drawingIndex % zones.length],
          discipline,
          status: drawingIndex === 27 ? "SUPERSEDED" : "ACTIVE",
        },
      });
      drawingCount += 1;

      const revisionTotal = drawingIndex < 20 ? 2 : 1;
      for (let revisionIndex = 0; revisionIndex < revisionTotal; revisionIndex += 1) {
        const status = statusFor(drawingIndex, revisionIndex);
        const riskLevel = (["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const)[
          (drawingIndex + revisionIndex) % 4
        ];
        const createdAt = addDays(baseDate, -35 + drawingIndex + revisionIndex * 4);
        const isReviewed = ["APPROVED", "ISSUED", "CLOSED"].includes(status);
        const isIssued = ["ISSUED", "CLOSED"].includes(status);
        const revision = await prisma.revision.create({
          data: {
            drawingId: drawing.id,
            revisionCode: String.fromCharCode(65 + revisionIndex),
            status,
            riskLevel,
            summary:
              revisionIndex === 0
                ? "Initial controlled issue for coordinated production use."
                : "Support geometry and access clearance updated after interface review.",
            reason:
              revisionIndex === 0
                ? "Baseline issue for downstream work-package coordination."
                : "Resolve the detected interface conflict before fabrication release.",
            mitigation:
              riskLevel === "HIGH" || riskLevel === "CRITICAL"
                ? "Hold the affected work package, brief production, and verify the revised interface before release."
                : null,
            effectiveDate: isReviewed ? addDays(createdAt, 5) : null,
            dueDate: addDays(createdAt, drawingIndex % 6 === 0 ? 2 : 14),
            ownerId: "demo-designer",
            createdById: "demo-designer",
            issuedAt: isIssued ? addDays(createdAt, 7) : null,
            closedAt: status === "CLOSED" ? addDays(createdAt, 10) : null,
            createdAt,
          },
        });
        revisionCount += 1;

        await prisma.revisionImpact.createMany({
          data: [
            {
              revisionId: revision.id,
              type: "PROCESS",
              target: processTargets[drawingIndex % processTargets.length],
              description: "Sequence and readiness must be checked against the revised geometry.",
              severity: riskLevel,
            },
            {
              revisionId: revision.id,
              type: "WORK_PACKAGE",
              target: `WP-${block}-${String((drawingIndex % 8) + 1).padStart(2, "0")}`,
              description: "Confirm that the latest revision is attached to the released work package.",
              severity: riskLevel === "CRITICAL" ? "HIGH" : "MEDIUM",
            },
            ...(revisionIndex === 1
              ? [
                  {
                    revisionId: revision.id,
                    type: "DRAWING" as const,
                    target: `DEMO-REF-${block}-${String(drawingIndex + 1).padStart(3, "0")}`,
                    description: "Interface dimensions should be cross-checked before approval.",
                    severity: "MEDIUM" as const,
                  },
                ]
              : []),
          ],
        });

        if (isReviewed) {
          await prisma.reviewRecord.create({
            data: {
              revisionId: revision.id,
              reviewerId: "demo-reviewer",
              decision: "APPROVED",
              comment: "Interfaces, impact list, and mitigation controls verified for demo release.",
              createdAt: addDays(createdAt, 4),
            },
          });
        }

        if (status === "CLOSED") {
          await prisma.acknowledgement.create({
            data: {
              revisionId: revision.id,
              userId: "demo-production",
              note: "Synthetic field-readiness check completed and recorded.",
              createdAt: addDays(createdAt, 9),
            },
          });
        }

        await prisma.auditEvent.createMany({
          data: [
            {
              actorId: "demo-designer",
              projectId: project.id,
              drawingId: drawing.id,
              revisionId: revision.id,
              action: "REVISION_CREATED",
              entityType: "Revision",
              entityId: revision.id,
              details: { revisionCode: revision.revisionCode, synthetic: true },
              createdAt,
            },
            ...(status !== "DRAFT"
              ? [
                  {
                    actorId: status === "IN_REVIEW" ? "demo-designer" : "demo-reviewer",
                    projectId: project.id,
                    drawingId: drawing.id,
                    revisionId: revision.id,
                    action: `STATUS_${status}`,
                    entityType: "Revision",
                    entityId: revision.id,
                    details: { to: status, synthetic: true },
                    createdAt: addDays(createdAt, 3),
                  },
                ]
              : []),
          ],
        });
      }
    }
  }

  console.log(
    `Seeded ${users.length} demo users, ${projects.length} projects, ${drawingCount} drawings, and ${revisionCount} revisions.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
