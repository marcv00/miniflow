import { Handle, Position, type NodeProps } from "reactflow";
import type { NodeData } from "../../../models/workflow/types";
import styles from "./StartNode.module.css";

export default function StartNode({ data }: NodeProps<NodeData>) {
  return (
    <div className={styles.nodeBox}>
      <div className={styles.nodeTitle}>START</div>
      <div className={styles.nodeLabel}>{data.label || "Inicio"}</div>
      <div className={styles.nodeHint}>1 por workflow</div>
      
      {/* Handle mantiene su estilo global desde index.css 
        porque es una clase interna de ReactFlow (.react-flow__handle)
      */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}