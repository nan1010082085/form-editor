/**
 * @vitest-environment node
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/utils/apiClient", () => ({
  apiClient: {
    requestUrl: vi.fn(),
  },
}));

vi.mock("@/utils/retryRequest", () => ({
  executeWithRetry: <T>(fn: () => Promise<T>) => fn(),
}));

import { apiClient } from "@/utils/apiClient";
import { fetchGenericList } from "@/api/dataApi";

describe("fetchGenericList dataPath fallback", () => {
  beforeEach(() => {
    vi.mocked(apiClient.requestUrl).mockReset();
  });

  it("without dataPath falls back to items", async () => {
    vi.mocked(apiClient.requestUrl).mockResolvedValue({
      items: [{ id: "1" }, { id: "2" }],
      total: 2,
    });
    const result = await fetchGenericList(
      { url: "/x" },
      { page: 1, pageSize: 10 },
    );
    expect(result.data).toEqual([{ id: "1" }, { id: "2" }]);
    expect(result.total).toBe(2);
  });

  it("explicit dataPath still takes precedence", async () => {
    vi.mocked(apiClient.requestUrl).mockResolvedValue({
      data: [{ id: "ignored" }],
      result: { records: [{ id: "ok" }] },
      total: 1,
    });
    const result = await fetchGenericList(
      { url: "/x", dataPath: "result.records" },
      { page: 1, pageSize: 10 },
    );
    expect(result.data).toEqual([{ id: "ok" }]);
  });
});
