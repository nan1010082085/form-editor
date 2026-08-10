/**
 * @vitest-environment node
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/utils/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "@/utils/apiClient";
import { fetchUsers, createUser } from "@/api/userApi";
import { fetchRoles, fetchPermissions } from "@/api/roleApi";

describe("userApi / roleApi contract", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
  });

  it("fetchUsers calls /users and returns unwrapped list", async () => {
    const payload = {
      items: [{ id: "u1", username: "a", displayName: "A", roles: [], tenantId: "t", status: "active" as const, createdAt: "", updatedAt: "" }],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    vi.mocked(apiClient.get).mockResolvedValue(payload);
    const res = await fetchUsers({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith("/users", expect.any(Object));
    expect(res.items[0].id).toBe("u1");
    expect(res.total).toBe(1);
  });

  it("createUser posts to /users", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      id: "u2",
      username: "b",
      displayName: "B",
      roles: [],
      tenantId: "t",
      status: "active",
      createdAt: "",
      updatedAt: "",
    });
    const created = await createUser({
      username: "b",
      password: "secret",
      displayName: "B",
    });
    expect(apiClient.post).toHaveBeenCalledWith("/users", expect.any(Object));
    expect(created.id).toBe("u2");
  });

  it("fetchRoles calls /roles and returns unwrapped list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      items: [
        {
          id: "r1",
          name: "Admin",
          permissions: [],
          data_scope: "all",
          dept_ids: [],
          createdAt: "",
          updatedAt: "",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
    const res = await fetchRoles();
    expect(apiClient.get).toHaveBeenCalledWith("/roles", expect.any(Object));
    expect(res.items[0].id).toBe("r1");
  });

  it("fetchPermissions unwraps items from /roles/permissions", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      items: [{ id: "p1", code: "user:read", name: "读用户", module: "user" }],
      total: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
    const items = await fetchPermissions();
    expect(apiClient.get).toHaveBeenCalledWith("/roles/permissions");
    expect(items).toEqual([
      { id: "p1", code: "user:read", name: "读用户", module: "user" },
    ]);
  });
});
