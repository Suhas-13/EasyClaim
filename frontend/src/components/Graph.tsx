import React from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  NodeMouseHandler,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

type NodeProps = {
  label: string;
};

export enum Status {
  ClaimSubmitted = "Claim Submitted",
  AwaitingCustomerDocuments = "📄 Awaiting Customer Documents",
  AwaitingSellerDocuments = "📂 Awaiting Seller Documents",
  AwaitingLLMScreening = "🔍 Awaiting LLM Screening",
  AwaitingReview = "📋 Awaiting Review",
  ClaimApproved = "✅ Claim Approved",
  ClaimRejected = "❌ Claim Rejected",
}
const initialNodes: Node<NodeProps>[] = [
  {
    id: "1",
    position: { x: 100, y: 50 },
    data: { label: Status.ClaimSubmitted },
    style: { background: "#EFEFEF", color: "#333", borderRadius: "8px" },
  },
  {
    id: "2",
    position: { x: 100, y: 150 },
    data: { label: Status.AwaitingCustomerDocuments },
    style: { background: "#FCE4EC", color: "#AD1457", borderRadius: "8px" },
  },
  {
    id: "3",
    position: { x: 300, y: 150 },
    data: { label: Status.AwaitingSellerDocuments },
    style: { background: "#FFF9C4", color: "#F57F17", borderRadius: "8px" },
  },
  {
    id: "4",
    position: { x: 200, y: 250 },
    data: { label: Status.AwaitingLLMScreening },
    style: { background: "#E8F5E9", color: "#2E7D32", borderRadius: "8px" },
  },
  {
    id: "5",
    position: { x: 100, y: 350 },
    data: { label: Status.AwaitingReview },
    style: { background: "#E3F2FD", color: "#1565C0", borderRadius: "8px" },
  },
  {
    id: "6",
    position: { x: 50, y: 450 },
    data: { label: Status.ClaimApproved },
    style: { background: "#C8E6C9", color: "#1B5E20", borderRadius: "8px" },
  },
  {
    id: "7",
    position: { x: 250, y: 450 },
    data: { label: Status.ClaimRejected },
    style: { background: "#FFCDD2", color: "#B71C1C", borderRadius: "8px" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    type: "smoothstep",
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    type: "smoothstep",
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "smoothstep",
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    label: "LLM Complete",
    type: "smoothstep",
    style: { stroke: "green" },
    labelStyle: { fill: "green", fontWeight: 600 },
  },
  {
    id: "e5-6",
    source: "5",
    target: "6",
    label: "Approve",
    type: "smoothstep",
    style: { stroke: "#1B5E20" },
    labelStyle: { fill: "#1B5E20", fontWeight: 600 },
  },
  {
    id: "e5-7",
    source: "5",
    target: "7",
    label: "Reject",
    type: "smoothstep",
    style: { stroke: "#B71C1C" },
    labelStyle: { fill: "#B71C1C", fontWeight: 600 },
  },
];

export const Graph = ({
  handleStateClaimChange,
}: {
  handleStateClaimChange: (claimState: string) => void;
}) => {
  const onNodeClick: NodeMouseHandler<Node<NodeProps>> = React.useCallback(
    (event, node) => {
      handleStateClaimChange(node.data.label);
    },
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="flex w-1/2">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background gap={12} size={1} color="#808080" />
        <Controls />
      </ReactFlow>
    </div>
  );
};
