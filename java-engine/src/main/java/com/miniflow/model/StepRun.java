package com.miniflow.model;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Records the execution of a single node within a Run.
 * 
 * RF-B10: The system must record each node execution as a StepRun.
 * RF-B11: Each StepRun must record status, timestamps, output, and errors.
 */
public class StepRun {
    public String nodeId;
    public String nodeType;
    public String nodeLabel;
    public String status; // PENDING | RUNNING | SUCCESS | ERROR | SKIPPED
    public String startedAt; // ISO-8601 timestamp
    public String finishedAt; // ISO-8601 timestamp
    public long durationMs;
    public Map<String, Object> output;
    public String error;

    public StepRun() {
        this.output = new LinkedHashMap<>();
    }

    public StepRun(String nodeId, String nodeType, String nodeLabel) {
        this.nodeId = nodeId;
        this.nodeType = nodeType;
        this.nodeLabel = nodeLabel;
        this.status = "PENDING";
        this.output = new LinkedHashMap<>();
    }

    public void markRunning() {
        this.status = "RUNNING";
        this.startedAt = java.time.Instant.now().toString();
    }

    public void markSuccess(Map<String, Object> producedVars) {
        this.status = "SUCCESS";
        this.finishedAt = java.time.Instant.now().toString();
        this.durationMs = calcDuration();
        if (producedVars != null) {
            this.output.putAll(producedVars);
        }
    }

    public void markError(String errorMessage) {
        this.status = "ERROR";
        this.error = errorMessage;
        this.finishedAt = java.time.Instant.now().toString();
        this.durationMs = calcDuration();
    }

    public void markSkipped() {
        this.status = "SKIPPED";
        this.finishedAt = java.time.Instant.now().toString();
        this.durationMs = 0;
    }

    private long calcDuration() {
        if (startedAt == null || finishedAt == null)
            return 0;
        try {
            java.time.Instant start = java.time.Instant.parse(startedAt);
            java.time.Instant end = java.time.Instant.parse(finishedAt);
            return java.time.Duration.between(start, end).toMillis();
        } catch (Exception e) {
            return 0;
        }
    }
}
