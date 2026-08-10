import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/utils/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "@/utils/apiClient";
import { fetchWidgetDataSource } from "@/api/widgetApi";

describe("fetchWidgetDataSource", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("returns business object that contains a data field as-is", async () => {
    const payload = {
      applicantName: "Tom",
      data: { nested: true },
      flowInstanceId: "f1",
    };
    vi.mocked(apiClient.get).mockResolvedValue(payload);
    await expect(fetchWidgetDataSource("/api/detail")).resolves.toEqual(payload);
  });

  it("unwraps pure { data } wrapper only", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { items: [1] } });
    await expect(fetchWidgetDataSource("/api/list")).resolves.toEqual({
      items: [1],
    });
  });

  it("returns array / primitive payloads unchanged", async () => {
    vi.mocked(apiClient.get).mockResolvedValue([{ id: 1 }]);
    await expect(fetchWidgetDataSource("/api/arr")).resolves.toEqual([
      { id: 1 },
    ]);
  });
});
