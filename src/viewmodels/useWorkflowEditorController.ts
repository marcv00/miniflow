import { useCallback, useState, useMemo } from "react";
import { useReactFlow } from "reactflow";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";
import { useWorkflowIO } from "./useWorkflowIO";
import { useCanvasDnD } from "./useCanvasDnD";
import { useWorkflowViewModel } from "./useWorkflowViewModel";

type ViewModelReturn = ReturnType<typeof useWorkflowViewModel>;

export function useWorkflowEditorController(
    state: ViewModelReturn["state"],
    handlers: ViewModelReturn["handlers"]
) {
    const reactFlowInstance = useReactFlow();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [importOpen, setImportOpen] = useState(false);
    const [importJson, setImportJson] = useState("");
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [pillTab, setPillTab] = useState<"steps" | "terminal">("steps");
    const [timelineStep, setTimelineStep] = useState<any>(null);

    const { onFileChange, fileInputRef, triggerImport, downloadJsonFile, copyToClipboard } = useWorkflowIO((wf) => {
        handlers.setNodes(wf.nodes);
        handlers.setEdges(wf.edges);
        showToast("Workflow importado desde archivo");
    });

    /* ── Drag & Drop ── */
    const { onDragOver, onDrop } = useCanvasDnD(handlers);

    /* ── Optimización: mapa de nodos para acceso O(1) ── */
    const nodeMap = useMemo(() => {
        const map = new Map<string, any>();
        state.nodes.forEach((n: any) => map.set(n.id, n));
        return map;
    }, [state.nodes]);

    /* ── Node Actions for Context ── */
    const nodeActions = useMemo(() => ({
        onEdit: (nodeId: string) => handlers.setEditingNodeId(nodeId),
        onDuplicate: (nodeId: string) => handlers.duplicateNode(nodeId),
        onDelete: (nodeId: string) => handlers.deleteNode(nodeId)
    }), [handlers]);

    /* ── Modals & UI Handlers ── */
    const handleSerializeAndCopy = useCallback(async () => {
        await copyToClipboard(state, handlers);
        showToast("JSON copiado al portapapeles");
    }, [copyToClipboard, state, handlers, showToast]);
    const handleSerializeAndDownload = useCallback(() => downloadJsonFile(state, handlers), [downloadJsonFile, state, handlers]);
    const handleDeleteRequest = useCallback(() => setDeleteOpen(true), []);
    const handleImportTextRequest = useCallback(() => { setImportJson(""); setImportOpen(true); }, []);

    const handleFocusNode = useCallback((nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (node) {
        reactFlowInstance.setCenter(
            node.position.x + 75,
            node.position.y + 25,
            { zoom: 1.5, duration: 400 }
        );
    }
}, [nodeMap, reactFlowInstance]);

    const handleCloseConfigModal = useCallback(() => {
        handlers.setEditingNodeId(null);
        setTimelineStep(null);
    }, [handlers]);

    const handleImportWorkflow = useCallback((nodes: any[], edges: any[]) => {
        handlers.setNodes(nodes);
        handlers.setEdges(edges);
    }, [handlers]);

    const handleCloseImportModal = useCallback(() => setImportOpen(false), []);

    const handleConfirmDelete = useCallback(() => {
        handlers.deleteCurrent();
        navigate("/workflows");
    }, [handlers, navigate]);

    const handleCloseDeleteModal = useCallback(() => setDeleteOpen(false), []);

    return {
        uiState: {
            importOpen,
            importJson,
            deleteOpen,
            historyOpen,
            pillTab,
            timelineStep,
        },
        uiSetters: {
            setImportJson,
            setPillTab,
            setTimelineStep,
            setHistoryOpen,
        },
        io: {
            onFileChange,
            fileInputRef,
            triggerImport,
        },
        canvas: {
            onDragOver,
            onDrop,
            nodeActions,
        },
        handlers: {
            handleSerializeAndCopy,
            handleSerializeAndDownload,
            handleDeleteRequest,
            handleImportTextRequest,
            handleFocusNode,
            handleCloseConfigModal,
            handleImportWorkflow,
            handleCloseImportModal,
            handleConfirmDelete,
            handleCloseDeleteModal,
        }
    };
}
