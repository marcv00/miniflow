package com.miniflow.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a single execution of a workflow.
 * Created at the start of each run, persisted as JSON by RunStore.
 * 
 * RF-B03: The system must create a Run entity when execution starts.
 */
public class Run {
    public String runId;
    public String workflowName;
    public String status; // RUNNING | FINISHED | FINISHED_WITH_ERRORS | FAILED
    public String startedAt; // ISO-8601 timestamp
    public String finishedAt; // ISO-8601 timestamp
    public List<StepRun> steps;

    public Run() {
        this.steps = new ArrayList<>();
    }

    public Run(String runId, String workflowName) {
        this.runId = runId;
        this.workflowName = workflowName;
        this.status = "RUNNING";
        this.startedAt = java.time.Instant.now().toString();
        this.steps = new ArrayList<>();
    }

    public void finish(boolean hasErrors) {
        this.finishedAt = java.time.Instant.now().toString();
        this.status = hasErrors ? "FINISHED_WITH_ERRORS" : "FINISHED";
    }

    public void fail() {
        this.finishedAt = java.time.Instant.now().toString();
        this.status = "FAILED";
    }

    public void addStep(StepRun step) {
        this.steps.add(step);
    }
}
