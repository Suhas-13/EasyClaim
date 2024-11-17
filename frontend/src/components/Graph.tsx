import React from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
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
    style: { background: "#1e293b", color: "#ffffff", borderRadius: "8px" }, // slate-950 background and white text
  },
  {
    id: "2",
    position: { x: 100, y: 150 },
    data: { label: Status.AwaitingCustomerDocuments },
    style: { background: "#1e293b", color: "#ffffff", borderRadius: "8px" }, // slate-950 background and white text
  },
  {
    id: "3",
    position: { x: 300, y: 150 },
    data: { label: Status.AwaitingSellerDocuments },
    style: { background: "#1e293b", color: "#ffffff", borderRadius: "8px" }, // slate-950 background and white text
  },
  {
    id: "4",
    position: { x: 200, y: 250 },
    data: { label: Status.AwaitingLLMScreening },
    style: { background: "#1e293b", color: "#ffffff", borderRadius: "8px" }, // slate-950 background and white text
  },
  {
    id: "5",
    position: { x: 100, y: 350 },
    data: { label: Status.AwaitingReview },
    style: { background: "#1e293b", color: "#ffffff", borderRadius: "8px" }, // slate-950 background and white text
  },
  {
    id: "6",
    position: { x: 50, y: 450 },
    data: { label: Status.ClaimApproved },
    style: { background: "#1e293b", color: "#ffffff", borderRadius: "8px" }, // slate-950 background and white text
  },
  {
    id: "7",
    position: { x: 250, y: 450 },
    data: { label: Status.ClaimRejected },
    style: { background: "#1e293b", color: "#ffffff", borderRadius: "8px" }, // slate-950 background and white text
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#CBD5E0", strokeWidth: 2 },
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#CBD5E0", strokeWidth: 2 },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#CBD5E0", strokeWidth: 2 },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#CBD5E0", strokeWidth: 2 },
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    label: "LLM Complete",
    type: "smoothstep",
    style: { stroke: "#68D391", strokeWidth: 2 },
    labelStyle: { fill: "#68D391", fontWeight: 600 },
    animated: true,
  },
  {
    id: "e5-6",
    source: "5",
    target: "6",
    label: "Approve",
    type: "smoothstep",
    style: { stroke: "#38A169", strokeWidth: 2 },
    labelStyle: { fill: "#38A169", fontWeight: 600 },
    animated: true,
  },
  {
    id: "e5-7",
    source: "5",
    target: "7",
    label: "Reject",
    type: "smoothstep",
    style: { stroke: "#E53E3E", strokeWidth: 2 },
    labelStyle: { fill: "#E53E3E", fontWeight: 600 },
    animated: true,
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
    <div className="flex w-full bg-slate-950"> {/* Make the background of the container dark */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background gap={12} size={1} color="#2D3748" /> {/* Dark background for the graph */}
        <Controls />
      </ReactFlow>
    </div>
  );
};
