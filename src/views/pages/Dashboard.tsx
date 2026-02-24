import { useNavigate, Link } from "react-router-dom";
import { useState,  useRef } from "react";
import { MoreVertical, Pencil, Trash2, Plus, Zap, ArrowLeftRight, Clock, Package, AlertTriangle } from "lucide-react";
import { loadAll, saveAll } from "../../models/storage/LocalStorage";
import { emptyWorkflow } from "../../models/workflow/WorkflowFactory";
import type { Workflow } from "../../models/workflow/types";
import styles from "./Dashboard.module.css";
import { useCloseOnOutsideClick } from "../../viewmodels/helpers/useCloseOnOutsideClick";
function formatDate(iso?: string) {
    if (!iso) return "Nunca ejecutado";
    const d = new Date(iso);
    return `Última ejecución: ${d.toLocaleDateString("es-PE", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit" })}`;
}

function StatusDot({ status }: { status?: string }) {
    const cls =
        status === "valid" ? styles.statusValid
            : status === "invalid" ? styles.statusInvalid
                : styles.statusPending;
    return <span className={`${styles.statusDot} ${cls}`} />;
}

function KebabMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useCloseOnOutsideClick(ref, open, () => setOpen(false));

    return (
        <div className={styles.menuWrap} ref={ref}>
            <button
                className={styles.kebab}
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            >
                <MoreVertical size={16} />
            </button>
            {open && (
                <div className={styles.dropdown}>
                    <button
                        className={styles.dropdownItem}
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
                    >
                        <Pencil size={14} /> Editar Detalles
                    </button>
                    <button
                        className={styles.dropdownItemDanger}
                        onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
                    >
                        <Trash2 size={14} /> Eliminar
                    </button>
                </div>
            )}
        </div>
    );
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, desc: string) => void }) {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim(), desc.trim());
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <form className={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
                <div className={styles.modalTitle}>Crear Nuevo Workflow</div>
                <div className={styles.modalSubtitle}>Define la identidad de tu workflow antes de entrar al constructor.</div>

                <div className={styles.modalField}>
                    <label>Nombre *</label>
                    <input
                        autoFocus
                        placeholder="Mi Workflow"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div className={styles.modalField}>
                    <label>Descripción</label>
                    <textarea
                        placeholder="¿Qué hace este workflow?"
                        value={desc}
                        onChange={e => setDesc(e.target.value)}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
                    <button type="submit" className={styles.btnPrimary} disabled={!name.trim()}>Crear</button>
                </div>
            </form>
        </div>
    );
}

function DeleteModal({ wf, onClose, onConfirm }: { wf: Workflow; onClose: () => void; onConfirm: () => void }) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.deleteIcon}><AlertTriangle size={40} color="#d23750" /></div>
                <div className={styles.modalTitle}>Eliminar Workflow</div>
                <p className={styles.deleteMessage}>
                    ¿Estás seguro de que deseas eliminar <strong>{wf.name || "Sin título"}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className={styles.modalActions}>
                    <button className={styles.btnGhost} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnDanger} onClick={onConfirm}>Eliminar</button>
                </div>
            </div>
        </div>
    );
}

function EditModal({ wf, onClose, onSave }: { wf: Workflow; onClose: () => void; onSave: (name: string, desc: string) => void }) {
    const [name, setName] = useState(wf.name);
    const [desc, setDesc] = useState(wf.description);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave(name.trim(), desc.trim());
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <form className={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
                <div className={styles.modalTitle}>Editar Detalles del Workflow</div>
                <div className={styles.modalSubtitle}>Actualiza el nombre y la descripción de tu workflow.</div>

                <div className={styles.modalField}>
                    <label>Nombre *</label>
                    <input autoFocus value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className={styles.modalField}>
                    <label>Descripción</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} />
                </div>

                <div className={styles.modalActions}>
                    <button type="button" className={styles.btnGhost} onClick={onClose}>Cancelar</button>
                    <button type="submit" className={styles.btnPrimary} disabled={!name.trim()}>Guardar</button>
                </div>
            </form>
        </div>
    );
}

export function Dashboard() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<Workflow[]>(() => loadAll());
    const [showCreate, setShowCreate] = useState(false);
    const [deletingWf, setDeletingWf] = useState<Workflow | null>(null);
    const [editingWf, setEditingWf] = useState<Workflow | null>(null);

    const handleCreate = (name: string, desc: string) => {
        const wf = { ...emptyWorkflow(), name, description: desc };
        const next = [wf, ...workflows];
        saveAll(next);
        setWorkflows(next);
        navigate(`/editor/${wf.id}`);
    };

    const handleDelete = () => {
        if (!deletingWf) return;
        const next = workflows.filter(w => w.id !== deletingWf.id);
        saveAll(next);
        setWorkflows(next);
        setDeletingWf(null);
    };

    const handleEditSave = (name: string, desc: string) => {
        if (!editingWf) return;
        const next = workflows.map(w =>
            w.id === editingWf.id ? { ...w, name, description: desc } : w
        );
        saveAll(next);
        setWorkflows(next);
        setEditingWf(null);
    };

    return (
        <div className={styles.dashboard}>
            <header className={styles.topbar}>
                <div className={styles.title}>
                    <Link to="/" className={styles.brandLink}>MINIFLOW</Link>
                    <span style={{ opacity: 0.2 }}>/</span>
                    <h1 className={styles.titleText}>Tus Workflows</h1>
                </div>
                <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
                    <Plus size={16} /> Crear Nuevo
                </button>
            </header>

            {workflows.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}><Package size={56} strokeWidth={1} /></div>
                    <p className={styles.emptyText}>Aún no tienes workflows. Empieza a automatizar con MINIFLOW.</p>
                    <button className={styles.btnPrimary} onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> Crea tu primer workflow
                    </button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {workflows.map(wf => (
                        <div
                            key={wf.id}
                            className={styles.card}
                            onClick={() => navigate(`/editor/${wf.id}`)}
                        >
                            <div className={styles.cardHeader}>
                                <StatusDot status={wf.validationStatus} />
                                <span className={styles.cardName}>{wf.name || "Sin título"}</span>
                                <KebabMenu
                                    onEdit={() => setEditingWf(wf)}
                                    onDelete={() => setDeletingWf(wf)}
                                />
                            </div>
                            <div className={styles.cardDesc}>{wf.description || "Sin descripción"}</div>
                            <div className={styles.cardMeta}>
                                <span><Zap size={12} /> {wf.nodes.length} nodos</span>
                                <span><ArrowLeftRight size={12} /> {wf.edges.length} conexiones</span>
                            </div>
                            <div className={styles.cardTimestamp}><Clock size={11} /> {formatDate(wf.lastRunAt)}</div>
                        </div>
                    ))}
                </div>
            )}

            {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
            {deletingWf && <DeleteModal wf={deletingWf} onClose={() => setDeletingWf(null)} onConfirm={handleDelete} />}
            {editingWf && <EditModal wf={editingWf} onClose={() => setEditingWf(null)} onSave={handleEditSave} />}
        </div>
    );
}
