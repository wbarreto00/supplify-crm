import type { ActivityType, CompanyStatus, DealStage } from "@/lib/types";

function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const tone = {
    lead: "bg-amber-100 text-amber-800",
    prospect: "bg-blue-100 text-blue-800",
    active: "bg-emerald-100 text-emerald-800",
    lost: "bg-zinc-200 text-zinc-700",
  }[status];

  return (
    <span className={classNames("rounded-full px-2 py-1 text-xs font-medium", tone)}>{status}</span>
  );
}

export function DealStageBadge({ stage }: { stage: DealStage }) {
  const tone = {
    new: "bg-sky-100 text-sky-800",
    qualified: "bg-indigo-100 text-indigo-800",
    proposal: "bg-violet-100 text-violet-800",
    negotiation: "bg-orange-100 text-orange-800",
    won: "bg-emerald-100 text-emerald-800",
    lost: "bg-zinc-200 text-zinc-700",
  }[stage];

  return (
    <span className={classNames("rounded-full px-2 py-1 text-xs font-medium", tone)}>{stage}</span>
  );
}

export function ActivityTypeBadge({ type }: { type: ActivityType }) {
  const tone = {
    call: "bg-cyan-100 text-cyan-800",
    email: "bg-fuchsia-100 text-fuchsia-800",
    meeting: "bg-lime-100 text-lime-800",
    task: "bg-slate-200 text-slate-700",
  }[type];

  return (
    <span className={classNames("rounded-full px-2 py-1 text-xs font-medium", tone)}>{type}</span>
  );
}
