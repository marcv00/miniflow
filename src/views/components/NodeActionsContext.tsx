import { createContext, useContext } from "react";

interface NodeActions {
    onEdit: (nodeId: string) => void;
    onDuplicate: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
}

const NodeActionsContext = createContext<NodeActions>({
    onEdit: () => { },
    onDuplicate: () => { },
    onDelete: () => { },
});

export const NodeActionsProvider = NodeActionsContext.Provider;
export const useNodeActions = () => useContext(NodeActionsContext);
