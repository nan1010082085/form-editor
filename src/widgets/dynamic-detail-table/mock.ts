export const dynamicDetailTableMock = {
  kind: "record" as const,
  defaultProps: {
    columns: [
      { prop: "name", label: "Item", type: "input" },
      { prop: "amount", label: "Amount", type: "number" },
    ],
  },
  staticData: {
    rows: [
      { name: "交通费", amount: 120 },
      { name: "住宿费", amount: 380 },
    ],
  },
};
