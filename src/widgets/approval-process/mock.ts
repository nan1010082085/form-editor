/**
 * approval-process Widget DefaultData
 */

/** Edit态预览用Default props */
export const approvalProcessMock = {
  defaultProps: {
    orientation: "horizontal",
    showTimeline: true,
    nodeSize: "medium",
    activeColor: "#409eff",
    approvedColor: "#67c23a",
    rejectedColor: "#f56c6c",
  },
};

/** 示例流程节点 */
export const APPROVAL_MOCK_NODES = [
  {
    id: "node1",
    label: "Submit申请",
    status: "approved",
    assignee: "Zhang San",
    time: "2024-01-15 09:00",
    comment: "申请已Submit",
  },
  {
    id: "node2",
    label: "Department审批",
    status: "approved",
    assignee: "Li Si",
    time: "2024-01-15 10:30",
    comment: "同意",
  },
  {
    id: "node3",
    label: "财务审批",
    status: "active",
    assignee: "Wang Wu",
    time: "",
    comment: "",
  },
  {
    id: "node4",
    label: "总经理审批",
    status: "pending",
    assignee: "Zhao Liu",
    time: "",
    comment: "",
  },
  {
    id: "node5",
    label: "完成",
    status: "pending",
    assignee: "",
    time: "",
    comment: "",
  },
];
