import { ACTIVITY_TYPE_LABEL_PT, ACTIVITY_TYPES, COMPANY_SOURCES, DEAL_STAGES, STAGE_LABEL_PT } from "@/lib/constants";

export function CompanyStageOptions() {
  return (
    <>
      {DEAL_STAGES.map((stage) => (
        <option value={stage} key={stage}>
          {STAGE_LABEL_PT[stage]}
        </option>
      ))}
    </>
  );
}

export function DealStageOptions() {
  return (
    <>
      {DEAL_STAGES.map((stage) => (
        <option value={stage} key={stage}>
          {STAGE_LABEL_PT[stage]}
        </option>
      ))}
    </>
  );
}

export function ActivityTypeOptions() {
  return (
    <>
      {ACTIVITY_TYPES.map((type) => (
        <option value={type} key={type}>
          {ACTIVITY_TYPE_LABEL_PT[type]}
        </option>
      ))}
    </>
  );
}

export function CompanySourceOptions() {
  return (
    <>
      {COMPANY_SOURCES.map((source) => (
        <option value={source} key={source}>
          {source}
        </option>
      ))}
    </>
  );
}
