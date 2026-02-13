import { useState, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Flag, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react";
import { useNodeActions } from "../NodeActionsContext";
import type { NodeData } from "../../../models/workflow/types";
import base from "./BaseNode.module.css";

export default function EndNode({ id, data }: NodeProps<NodeData>) {
  const { onEdit, onDuplicate, onDelete } = useNodeActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className={base.nodeBox} style={{ borderLeft: "3px solid #d23750" }}>
      <div className={base.nodeHeader}>
        <div className={base.nodeTypeBadge} style={{ color: "#d23750" }}>
          <Flag size={13} /> END
        </div>
        <div className={base.kebabWrap} ref={menuRef}>
          <button className={base.kebabBtn} onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className={base.dropdown}>
              <button className={base.dropdownItem} onClick={() => { onEdit(id); setMenuOpen(false); }}><Pencil size={13} /> Editar</button>
              <button className={base.dropdownItem} onClick={() => { onDuplicate(id); setMenuOpen(false); }}><Copy size={13} /> Duplicar</button>
              <button className={base.dropdownItemDanger} onClick={() => { onDelete(id); setMenuOpen(false); }}><Trash2 size={13} /> Eliminar</button>
            </div>
          )}
        </div>
      </div>
      <div className={base.nodeLabel}>{data.label || "Fin"}</div>
      <div className={base.nodeHint}>final del workflow</div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
