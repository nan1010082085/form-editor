export const notificationMock = {
  kind: "record" as const,
  staticData: {
    items: [
      {
        id: "1",
        title: "系统维护Notification",
        content: "本week六 02:00–04:00 进Row例Row维护。",
        publishAt: "2026-07-01T10:00:00Z",
      },
      {
        id: "2",
        title: "请假制度Update",
        content: "year假计算Rule已Update, 请查阅人事制度。",
        publishAt: "2026-06-28T09:00:00Z",
      },
    ],
  },
};
