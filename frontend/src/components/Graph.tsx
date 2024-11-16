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
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 100, y: 50 },
    data: { label: "📝 Claim Submitted" },
    style: { background: "#EFEFEF", color: "#333", borderRadius: "8px" },
  },
  {
    id: "2",
    position: { x: 100, y: 150 },
    data: { label: "📄 Awaiting Customer Documents" },
    style: { background: "#FCE4EC", color: "#AD1457", borderRadius: "8px" },
  },
  {
    id: "3",
    position: { x: 300, y: 150 },
    data: { label: "📂 Awaiting Seller Documents" },
    style: { background: "#FFF9C4", color: "#F57F17", borderRadius: "8px" },
  },
  {
    id: "4",
    position: { x: 200, y: 250 },
    data: { label: "🔍 Awaiting LLM Screening" },
    style: { background: "#E8F5E9", color: "#2E7D32", borderRadius: "8px" },
  },
  {
    id: "5",
    position: { x: 100, y: 350 },
    data: { label: "📋 Awaiting Review" },
    style: { background: "#E3F2FD", color: "#1565C0", borderRadius: "8px" },
  },
  {
    id: "6",
    position: { x: 50, y: 450 },
    data: { label: "✅ Claim Approved" },
    style: { background: "#C8E6C9", color: "#1B5E20", borderRadius: "8px" },
  },
  {
    id: "7",
    position: { x: 250, y: 450 },
    data: { label: "❌ Claim Rejected" },
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

export const Graph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background gap={12} size={1} color="#ddd" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.id) {
              case "1":
                return "#EFEFEF";
              case "2":
                return "#FCE4EC";
              case "3":
                return "#FFF9C4";
              case "4":
                return "#E8F5E9";
              case "5":
                return "#E3F2FD";
              case "6":
                return "#C8E6C9";
              case "7":
                return "#FFCDD2";
              default:
                return "#ddd";
            }
          }}
          maskColor="#ffffff"
        />
      </ReactFlow>
    </div>
  );
};
