export type ReportingViewState =
  | "loading"
  | "empty"
  | "partial"
  | "healthy"
  | "failure";

export function getReportingViewState(input: {
  loading: boolean;
  error: string | null;
  rowCount: number;
  issueCount: number;
}): ReportingViewState {
  if (input.loading) return "loading";
  if (input.error) return "failure";
  if (!input.rowCount) return input.issueCount ? "partial" : "empty";
  return input.issueCount ? "partial" : "healthy";
}
