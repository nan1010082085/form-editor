export const calendarMock = {
  kind: "record" as const,
  staticData: {
    events: [
      { date: "2026-07-02", title: "Item例会", type: "primary" },
      { date: "2026-07-05", title: "Department培训", type: "success" },
    ],
  },
};
