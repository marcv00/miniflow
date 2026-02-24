import { useReducer, useCallback } from "react";
import type { ValidationReport } from "../../models/workflow/types";

type UIState = {
  name: string;
  description: string;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  validationReport: ValidationReport | null;
};

type UIAction =
  | { type: "SYNC_WORKFLOW"; name: string; description: string }
  | { type: "RESET" }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_DESCRIPTION"; description: string }
  | { type: "SET_SELECTED_NODE"; id: string | null }
  | { type: "SET_EDITING_NODE"; id: string | null }
  | { type: "SET_VALIDATION"; report: ValidationReport | null };

const initialState: UIState = {
  name: "WORKFLOW",
  description: "",
  selectedNodeId: null,
  editingNodeId: null,
  validationReport: null,
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SYNC_WORKFLOW":
      return { ...initialState, name: action.name, description: action.description };
    case "RESET":
      return initialState;
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_DESCRIPTION":
      return { ...state, description: action.description };
    case "SET_SELECTED_NODE":
      return { ...state, selectedNodeId: action.id };
    case "SET_EDITING_NODE":
      return { ...state, editingNodeId: action.id };
    case "SET_VALIDATION":
      return { ...state, validationReport: action.report };
    default:
      return state;
  }
}

export function useWorkflowUIState(initialName?: string, initialDescription?: string) {
  const [state, dispatch] = useReducer(uiReducer, {
    ...initialState,
    name: initialName ?? "WORKFLOW",
    description: initialDescription ?? "",
  });

  return {
    ...state,
    setName: useCallback((name: string) => dispatch({ type: "SET_NAME", name }), []),
    setDescription: useCallback((description: string) => dispatch({ type: "SET_DESCRIPTION", description }), []),
    setSelectedNodeId: useCallback((id: string | null) => dispatch({ type: "SET_SELECTED_NODE", id }), []),
    setEditingNodeId: useCallback((id: string | null) => dispatch({ type: "SET_EDITING_NODE", id }), []),
    setValidationReport: useCallback((report: ValidationReport | null) => dispatch({ type: "SET_VALIDATION", report }), []),
    syncFromWorkflow: useCallback((name: string, description: string) =>
      dispatch({ type: "SYNC_WORKFLOW", name, description }), []),
  };
}