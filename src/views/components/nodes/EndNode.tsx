import { Handle, Position, type NodeProps } from "reactflow"
import type { NodeData } from "../../../models/workflow/types"
import styles from "./EndNode.module.css"

export default function EndNode({ data }: NodeProps<NodeData<"end">>) {
  return (
    <div className={styles.nodeBox}>
      <div className={styles.nodeTitle}>END</div>
      <div className={styles.nodeLabel}>{data.label || "Fin"}</div>

      <Handle type="target" position={Position.Left} />
    </div>
  )
}
