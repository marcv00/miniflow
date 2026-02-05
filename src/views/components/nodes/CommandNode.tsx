import { Handle, Position, type NodeProps } from "reactflow";
import type { NodeData } from "../../../models/workflow/types";
import styles from "./CommandNode.module.css";

export default function CommandNode({ data }: NodeProps<NodeData>) {
  const cfg: any = data.config || {};

  return (
    <div className={styles.nodeBox}>
      <div className={styles.nodeTitle}>COMMAND</div>
      <div className={styles.nodeLabel}>{data.label || "Command"}</div>
      <div className={styles.nodeHint}>
        {cfg.command || ""} {cfg.args || ""}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
