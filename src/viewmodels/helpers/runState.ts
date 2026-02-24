export type RunStatus = "idle" | "running" | "success" | "error";
export type EngineStep = {
    nodeId: string;
    nodeLabel?: string;
    nodeType?: string;
    status: string;
    durationMs?: number;
    error?: string;
};
export type EngineRun = {
    status?: "FINISHED" | "FINISHED_WITH_ERRORS" | "FAILED";
    steps?: EngineStep[];
    [key: string]: unknown;
};
/** Respuesta mínima que usamos del electronAPI */
export type EngineApiResponse = {
  ok: boolean;
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  run?: EngineRun | null;
};
export type RunSetters = {
  setRunStatus: (s: RunStatus) => void;
  setRunStdout: (s: string) => void;
  setRunStderr: (s: string) => void;
  setRunExitCode: (n: number | null) => void;
  setRunResult: (r: EngineRun | null) => void;
};
export function resetRunState(setters: RunSetters) {
  setters.setRunStatus("running");
  setters.setRunStdout("");
  setters.setRunStderr("");
  setters.setRunExitCode(null);
  setters.setRunResult(null);
}

export function applyRunResponse(res: EngineApiResponse, setters: RunSetters) {
  setters.setRunExitCode(res.exitCode ?? null);
  setters.setRunStdout(res.stdout ?? "");
  setters.setRunStderr(res.stderr ?? "");
  setters.setRunResult((res.run ?? null) as EngineRun | null);

  const status = res.run?.status;
  const hasErrors = status === "FINISHED_WITH_ERRORS" || status === "FAILED";
  setters.setRunStatus(!res.ok || hasErrors ? "error" : "success");
}