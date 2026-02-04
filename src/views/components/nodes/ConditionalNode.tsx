import { Handle, Position, type NodeProps } from "reactflow"
import type { NodeData } from "../../../models/workflow/types"
import styles from "./ConditionalNode.module.css"

export default function ConditionalNode({ data }: NodeProps<NodeData<"conditional">>) {
  return (
    <div className={styles.nodeBox}>
      <div className={styles.nodeTitle}>CONDITIONAL</div>
      <div className={styles.nodeLabel}>{data.label || "Condición"}</div>

      <div className={styles.nodeHint}>
        {data.config.leftPath} {data.config.op} {data.config.rightValue}
      </div>

      <Handle type="target" position={Position.Left} />

      <Handle id="TRUE" type="source" position={Position.Right} style={{ top: 20 }} />
      <Handle id="FALSE" type="source" position={Position.Right} style={{ top: 45 }} />
    </div>
  )
}
