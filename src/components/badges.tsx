import { ACTIVITY_TYPE_LABEL_PT, STAGE_LABEL_PT } from "@/lib/constants";
import type { ActivityType, DealStage } from "@/lib/types";

function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function DealStageBadge({ stage }: { stage: DealStage }) {
  const tone = {
    new: "bg-secondary text-secondary-foreground",
    qualified: "bg-secondary text-secondary-foreground",
    proposal: "bg-primary/10 text-primary",
    negotiation: "bg-secondary text-secondary-foreground",
    won: "bg-accent/10 text-accent",
    lost: "bg-muted text-muted-foreground",
  }[stage];

  return (
    <span className={classNames("rounded-full px-2 py-1 text-xs font-medium", tone)}>{STAGE_LABEL_PT[stage]}</span>
  );
}

export function ActivityTypeBadge({ type }: { type: ActivityType }) {
  const tone = {
    call: "bg-secondary text-secondary-foreground",
    email: "bg-secondary text-secondary-foreground",
    linkedin: "bg-secondary text-secondary-foreground",
    whatsapp: "bg-accent/10 text-accent",
    meeting: "bg-secondary text-secondary-foreground",
    task: "bg-muted text-muted-foreground",
  }[type];

  return (
    <span className={classNames("rounded-full px-2 py-1 text-xs font-medium", tone)}>{ACTIVITY_TYPE_LABEL_PT[type]}</span>
  );
}
