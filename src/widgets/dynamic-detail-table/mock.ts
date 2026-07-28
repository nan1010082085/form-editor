export const dynamicDetailTableMock = {
  kind: "record" as const,
  defaultProps: {
    columns: [
      { prop: "name", label: "项目", type: "input" },
      { prop: "amount", label: "金额", type: "number" },
    ],
  },
  staticData: {
    rows: [
      { name: "交通费", amount: 120 },
      { name: "住宿费", amount: 380 },
    ],
  },
};
