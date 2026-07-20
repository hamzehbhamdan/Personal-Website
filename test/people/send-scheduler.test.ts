import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scheduleSend } from "@/lib/dashboard/people/send-scheduler";

describe("scheduleSend", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires exactly once after the delay", () => {
    const fire = vi.fn();
    const h = scheduleSend(15000, fire);
    expect(h.pending).toBe(true);
    vi.advanceTimersByTime(14999);
    expect(fire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fire).toHaveBeenCalledTimes(1);
    expect(h.pending).toBe(false);
  });

  it("cancel() before the delay prevents the send and reports true", () => {
    const fire = vi.fn();
    const h = scheduleSend(15000, fire);
    expect(h.cancel()).toBe(true);
    vi.advanceTimersByTime(20000);
    expect(fire).not.toHaveBeenCalled();
    expect(h.pending).toBe(false);
  });

  it("cancel() after firing is a no-op that reports false", () => {
    const fire = vi.fn();
    const h = scheduleSend(15000, fire);
    vi.advanceTimersByTime(15000);
    expect(h.cancel()).toBe(false);
    expect(fire).toHaveBeenCalledTimes(1);
  });

  it("double-cancel reports false the second time", () => {
    const h = scheduleSend(15000, () => {});
    expect(h.cancel()).toBe(true);
    expect(h.cancel()).toBe(false);
  });
});
