import assert from "node:assert/strict";
import test from "node:test";

const { getReportingViewState } = await import(
  "../src/lib/reportingViewState.ts"
);

test("reporting presentation covers loading, empty, partial, healthy, and failure", () => {
  assert.equal(
    getReportingViewState({
      loading: true,
      error: null,
      rowCount: 0,
      issueCount: 0,
    }),
    "loading"
  );
  assert.equal(
    getReportingViewState({
      loading: false,
      error: null,
      rowCount: 0,
      issueCount: 0,
    }),
    "empty"
  );
  assert.equal(
    getReportingViewState({
      loading: false,
      error: null,
      rowCount: 1,
      issueCount: 1,
    }),
    "partial"
  );
  assert.equal(
    getReportingViewState({
      loading: false,
      error: null,
      rowCount: 1,
      issueCount: 0,
    }),
    "healthy"
  );
  assert.equal(
    getReportingViewState({
      loading: false,
      error: "failed",
      rowCount: 0,
      issueCount: 0,
    }),
    "failure"
  );
});
