import { Handle, Position, type NodeProps } from "reactflow"
import type { NodeData } from "../../../models/workflow/types"
import styles from "./HttpRequestNode.module.css"

export default function HttpRequestNode({ data }: NodeProps<NodeData<"http_request">>) {
  const cfg = data.config

  return (
    <div className={styles.nodeBox}>
      <div className={styles.nodeTitle}>HTTP_REQUEST</div>
      <div className={styles.nodeLabel}>{data.label || "Request"}</div>

      <div className={styles.nodeHint}>
        {cfg.method} {cfg.url || "(sin URL)"}
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
