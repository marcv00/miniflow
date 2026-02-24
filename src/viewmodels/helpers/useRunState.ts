import { useState } from "react";
import {
  resetRunState,
  applyRunResponse,
  type RunStatus,
  type EngineRun,
  type EngineApiResponse,
} from "./runState";

export function useRunState() {
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runStdout, setRunStdout] = useState("");
  const [runStderr, setRunStderr] = useState("");
  const [runExitCode, setRunExitCode] = useState<number | null>(null);
  const [runResult, setRunResult] = useState<EngineRun | null>(null);

  const setters = { setRunStatus, setRunStdout, setRunStderr, setRunExitCode, setRunResult };

  const reset = () => resetRunState(setters);
  const apply = (res: EngineApiResponse) => applyRunResponse(res, setters);

  return {
    runStatus,
    runStdout,
    runStderr,
    runExitCode,
    runResult,
    reset,
    apply,
    setRunStatus,
    setRunStderr,
  };
}

export type { EngineApiResponse } from "./runState";
