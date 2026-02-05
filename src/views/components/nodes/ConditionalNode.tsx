import { Handle, Position, type NodeProps } from "reactflow";
import type { NodeData } from "../../../models/workflow/types";
import styles from "./ConditionalNode.module.css";

export default function ConditionalNode({ data }: NodeProps<NodeData>) {
  const cfg: any = data.config || {};
  const condition = cfg.condition || "";

  return (
    <div className={styles.nodeBox}>
      <div className={styles.nodeTitle}>CONDITIONAL</div>
      <div className={styles.nodeLabel}>{data.label || "Evaluar"}</div>
      <div className={styles.nodeHint}>{condition}</div>

      <Handle type="target" position={Position.Left} />

      <div className={`${styles.chip} ${styles.chipTrue}`}>TRUE</div>
      <div className={`${styles.chip} ${styles.chipFalse}`}>FALSE</div>

      <Handle id="true" type="source" position={Position.Right} style={{ top: 44 }} />
      <Handle id="false" type="source" position={Position.Right} style={{ top: 82 }} />
    </div>
  );
}
