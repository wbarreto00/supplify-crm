import { ACTIVITY_TYPES, COMPANY_STATUSES, DEAL_STAGES } from "@/lib/constants";

export function CompanyStatusOptions() {
  return (
    <>
      {COMPANY_STATUSES.map((status) => (
        <option value={status} key={status}>
          {status}
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
          {stage}
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
          {type}
        </option>
      ))}
    </>
  );
}
