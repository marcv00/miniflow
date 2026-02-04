import { Handle, Position, type NodeProps } from "reactflow";
import type { NodeData } from "../../../models/workflow/types";
import styles from "./HttpRequestNode.module.css";

export default function HttpRequestNode({ data }: NodeProps<NodeData>) {
  const cfg: any = data.config || {};
  const method = cfg.method || "GET";
  const url = cfg.url || "";

  return (
    <div className={styles.nodeBox}>
      <div className={styles.nodeTitle}>HTTP_REQUEST</div>
      <div className={styles.nodeLabel}>{data.label || "Consultar API"}</div>
      <div className={styles.nodeHint}>
        {method} {url}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
