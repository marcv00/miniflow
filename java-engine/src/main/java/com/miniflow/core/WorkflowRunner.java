package com.miniflow.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.miniflow.context.ExecutionContext;
import com.miniflow.factory.ExecutorFactory;
import com.miniflow.model.*;
import com.miniflow.store.RunStore;

import java.util.*;

/**
 * Orchestrates workflow execution following node connections.
 *
 * RF-B04: Execute nodes following workflow connections.
 * RF-B05: Maintain a shared execution context.
 * RF-B06: Each node can read/write to the context.
 * RF-B12: Apply per-node error policy (STOP_ON_FAIL / CONTINUE_ON_FAIL).
 */
public class WorkflowRunner {

    private final RunStore runStore;
    private final ObjectMapper mapper;

    public WorkflowRunner() {
        this.runStore = new RunStore();
        this.mapper = new ObjectMapper();
        this.mapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    /**
     * Runs the full workflow, creating a Run with StepRuns.
     * Outputs the complete Run as JSON to stdout.
     */
    public Run run(Workflow workflow) {
        ExecutionContext context = ExecutionContext.getInstance();
        context.clear();

        String workflowName = (workflow.name != null && !workflow.name.isBlank())
                ? workflow.name
                : "Workflow";

        // RF-B03: Create Run entity
        Run run = new Run(UUID.randomUUID().toString(), workflowName);
        boolean hasErrors = false;

        System.err.println("Ejecutando \"" + workflowName + "\":");
        System.err.println("======================");

        try {
            // Find START node
            Node currentNode = workflow.nodes.stream()
                    .filter(n -> n.type != null && n.type.equalsIgnoreCase("START"))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No START node found"));

            while (currentNode != null) {
                // RF-B10: Create StepRun for each node
                StepRun step = new StepRun(
                        currentNode.id,
                        currentNode.type != null ? currentNode.type.toUpperCase() : "UNKNOWN",
                        safeLabel(currentNode));
                step.markRunning();
                run.addStep(step);

                // Capture context snapshot before execution
                Set<String> keysBefore = new HashSet<>(context.getAllVariables().keySet());

                String error = null;
                try {
                    ExecutorFactory.getExecutor(currentNode.type)
                            .execute(currentNode, context);
                } catch (Exception e) {
                    hasErrors = true;
                    error = (e.getMessage() == null || e.getMessage().isBlank())
                            ? e.getClass().getSimpleName()
                            : e.getMessage();
                    context.setVariable("__lastError", error);
                }

                // RF-B11: Record output — capture variables produced by this node
                Map<String, Object> producedVars = new LinkedHashMap<>();
                for (Map.Entry<String, Object> entry : context.getAllVariables().entrySet()) {
                    if (!keysBefore.contains(entry.getKey()) && !entry.getKey().startsWith("__")) {
                        producedVars.put(entry.getKey(), entry.getValue());
                    }
                }

                if (error != null) {
                    step.markError(error);
                    printStepResult(currentNode, step);

                    // RF-B12: Apply error policy
                    String policy = resolveErrorPolicy(currentNode);
                    if ("CONTINUE_ON_FAIL".equals(policy)) {
                        System.err.println("  → errorPolicy=CONTINUE_ON_FAIL, continuando...");
                        currentNode = resolveNextNode(workflow, currentNode, context);
                        continue;
                    } else {
                        System.err.println("  → errorPolicy=STOP_ON_FAIL, deteniendo.");
                        break;
                    }
                } else {
                    step.markSuccess(producedVars);
                    printStepResult(currentNode, step);
                }

                if ("END".equalsIgnoreCase(currentNode.type))
                    break;

                currentNode = resolveNextNode(workflow, currentNode, context);
            }

        } catch (Exception e) {
            hasErrors = true;
            run.fail();
            System.err.println("FATAL: " + e.getMessage());
        }

        // Finalize run
        if (!"FAILED".equals(run.status)) {
            run.finish(hasErrors);
        }
        context.setVariable("__workflowHasErrors", hasErrors);

        // Persist run to JSON file
        try {
            runStore.save(run);
        } catch (Exception e) {
            System.err.println("Warning: Could not persist run: " + e.getMessage());
        }

        // Output Run as JSON to stdout (this is what Electron reads)
        try {
            System.out.println(mapper.writeValueAsString(run));
        } catch (Exception e) {
            System.err.println("Error serializing Run: " + e.getMessage());
        }

        System.err.println("=============");
        System.err.println("Ejecucion completada - Status: " + run.status);

        return run;
    }

    /**
     * Executes a single node for testing (N8N-style test).
     */
    public Map<String, Object> testSingleNode(Node node) {
        ExecutionContext context = ExecutionContext.getInstance();
        context.clear();

        Map<String, Object> result = new LinkedHashMap<>();
        long start = System.currentTimeMillis();

        try {
            ExecutorFactory.getExecutor(node.type).execute(node, context);
            long duration = System.currentTimeMillis() - start;

            result.put("ok", true);
            result.put("durationMs", duration);
            result.put("output", context.getAllVariables());
            result.put("error", null);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            result.put("ok", false);
            result.put("durationMs", duration);
            result.put("output", context.getAllVariables());
            result.put("error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }

        return result;
    }

    // ─── Private Helpers ──────────────────────────────────────

    private void printStepResult(Node node, StepRun step) {
        System.err.println("Nodo: \"" + node.id + "\" (" + safeLabel(node) + ")");
        System.err.println("  Tipo: " + (node.type == null ? "" : node.type));
        System.err.println("  Status: " + step.status);
        if (step.error != null) {
            System.err.println("  Error: " + step.error);
        }
        System.err.println("  Duracion: " + step.durationMs + " ms");
        System.err.println("======================");
    }

    /**
     * Resolves the error policy for a given node from its config.
     * Default is STOP_ON_FAIL.
     */
    private String resolveErrorPolicy(Node node) {
        try {
            Map<String, Object> cfg = node.getEffectiveConfig();
            Object policy = cfg.get("errorPolicy");
            if (policy != null)
                return policy.toString();
        } catch (Exception ignored) {
        }
        return "STOP_ON_FAIL";
    }

    private String safeLabel(Node node) {
        // Check direct label field (portable format)
        if (node.label != null && !node.label.isEmpty())
            return node.label;
        try {
            if (node.data == null)
                return "";
            Object label = node.data.get("label");
            if (label != null)
                return String.valueOf(label);
        } catch (Exception ignored) {
        }
        return "";
    }

    private Node resolveNextNode(Workflow workflow, Node currentNode, ExecutionContext context) {
        String currentId = currentNode.id;
        String branch = null;

        if ("CONDITIONAL".equalsIgnoreCase(currentNode.type)) {
            Object b = context.getVariable("__branch");
            if (b != null)
                branch = String.valueOf(b);
        }

        Optional<Connection> edge;

        if (branch == null) {
            edge = workflow.edges.stream()
                    .filter(e -> currentId.equals(e.source))
                    .findFirst();
        } else {
            final String branchFinal = branch;
            edge = workflow.edges.stream()
                    .filter(e -> currentId.equals(e.source)
                            && ((e.label != null && e.label.equalsIgnoreCase(branchFinal))
                                    || (e.sourceHandle != null && e.sourceHandle.equalsIgnoreCase(branchFinal))))
                    .findFirst();
        }

        if (edge.isPresent()) {
            String nextId = edge.get().target;
            return workflow.nodes.stream()
                    .filter(n -> n.id.equals(nextId))
                    .findFirst()
                    .orElse(null);
        }

        return null;
    }
}