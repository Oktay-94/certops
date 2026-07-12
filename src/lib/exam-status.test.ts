import { describe, expect, it } from "vitest";
import { EXAM_DATE } from "./config";
import {
  countdownProgress,
  isExpired,
  resolveExamStatus,
} from "./exam-status";
import type { ExamStatus } from "@/db/schema";

describe("resolveExamStatus defaults (no DB row yet)", () => {
  it("oktay defaults to passed, merve to pending with EXAM_DATE", () => {
    const oktay = resolveExamStatus(null, "oktay");
    expect(oktay.result).toBe("passed");
    expect(oktay.persisted).toBe(false);

    const merve = resolveExamStatus(null, "merve");
    expect(merve.result).toBe("pending");
    expect(merve.examDate).toEqual(EXAM_DATE);
  });

  it("a DB row wins over the defaults", () => {
    const row = {
      id: 1,
      userId: "merve",
      cert: "CLF-C02",
      examDate: new Date("2026-09-01T00:00:00Z"),
      result: "failed",
      updatedAt: new Date("2026-07-12T10:00:00Z"),
    } as ExamStatus;
    const resolved = resolveExamStatus(row, "merve");
    expect(resolved.result).toBe("failed");
    expect(resolved.examDate).toEqual(row.examDate);
    expect(resolved.setAt).toEqual(row.updatedAt);
    expect(resolved.persisted).toBe(true);
  });
});

describe("isExpired", () => {
  it("false before, true at/after the date", () => {
    const date = new Date("2026-08-01T00:00:00Z");
    expect(isExpired(date, new Date("2026-07-31T23:59:59Z"))).toBe(false);
    expect(isExpired(date, date)).toBe(true);
    expect(isExpired(date, new Date("2026-08-02T00:00:00Z"))).toBe(true);
  });
});

describe("countdownProgress", () => {
  const setAt = new Date("2026-07-01T00:00:00Z");
  const exam = new Date("2026-07-31T00:00:00Z"); // 30-day window

  it("0% right after setting, ~50% mid-window, 100% at the exam", () => {
    expect(countdownProgress(setAt, exam, setAt)).toBe(0);
    expect(
      countdownProgress(setAt, exam, new Date("2026-07-16T00:00:00Z")),
    ).toBe(50);
    expect(countdownProgress(setAt, exam, exam)).toBe(100);
  });

  it("clamps outside the window and handles degenerate windows", () => {
    expect(
      countdownProgress(setAt, exam, new Date("2026-06-01T00:00:00Z")),
    ).toBe(0);
    expect(
      countdownProgress(setAt, exam, new Date("2026-12-01T00:00:00Z")),
    ).toBe(100);
    expect(countdownProgress(exam, exam, exam)).toBe(100);
  });
});
