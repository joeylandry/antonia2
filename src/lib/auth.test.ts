import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { safeNext } from "./auth";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext("/clients?q=a")).toBe("/clients?q=a");
    expect(safeNext("/clients/123/progress?range=3m#x")).toBe("/clients/123/progress?range=3m#x");
  });
  it.each(["//evil.com", "/\t/evil.com", "/\n/evil.com", "/\\evil.com", "https://evil.com", "evil.com", "/ /evil.com", "", null, undefined])(
    "rejects %j",
    (v) => expect(safeNext(v as string)).toBe("/"),
  );
});
