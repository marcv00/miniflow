package com.miniflow.core;

import com.miniflow.context.ExecutionContext;
import com.miniflow.factory.ExecutorFactory;
import com.miniflow.model.Connection;
import com.miniflow.model.Node;
import com.miniflow.model.Workflow;

import java.util.Map;
import java.util.Optional;

public class WorkflowRunner {

    public void run(Workflow workflow) {
        ExecutionContext context = ExecutionContext.getInstance();

        long workflowStart = System.currentTimeMillis();

        boolean hasErrors = false;

        String workflowName = (workflow != null && workflow.name != null && !workflow.name.isBlank())
            ? workflow.name
            : "Workflow";

        System.out.println("Ejecutando \"" + workflowName + "\":");
        System.out.println("======================");

        Node currentNode = workflow.nodes.stream()
            .filter(n -> n.type != null && n.type.equalsIgnoreCase("START"))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("No START node found"));

        while (currentNode != null) {
            String error = null;

            try {
                ExecutorFactory.getExecutor(currentNode.type).execute(currentNode, context);
            } catch (Exception e) {
                hasErrors = true;
                error = (e.getMessage() == null || e.getMessage().isBlank())
                    ? e.getClass().getSimpleName()
                    : e.getMessage();

                context.setVariable("__lastError", error);

                if (currentNode.type != null && currentNode.type.equalsIgnoreCase("HTTP_REQUEST")) {
                    Object status = context.getVariable("status");
                    if (status == null) context.setVariable("status", 0);
                }
            }

            String response = buildResponse(currentNode, context, error);
            printNodeBlock(currentNode, response);

            if (currentNode.type != null && currentNode.type.equalsIgnoreCase("END")) break;

            currentNode = resolveNextNode(workflow, currentNode, context);
        }

        context.setVariable("__workflowHasErrors", hasErrors);

        long workflowEnd = System.currentTimeMillis();
        System.out.println("=============");
        System.out.println("Ejecución completada en " + (workflowEnd - workflowStart) + " ms");
    }

    private void printNodeBlock(Node node, String response) {
        System.out.println("Nodo: \"" + node.id + "\"");
        System.out.println("Descripcion: " + safeLabel(node));
        System.out.println("Tipo: " + (node.type == null ? "" : node.type));
        System.out.println("Respuesta: " + response);
        System.out.println("======================");
    }

    private String buildResponse(Node node, ExecutionContext context, String error) {
        if (error != null) return "ERROR: " + error;

        String t = node.type == null ? "" : node.type.toUpperCase();

        if (t.equals("HTTP_REQUEST")) {
            Map<String, Object> cfg = safeConfig(node);
            String method = cfg.get("method") == null ? "GET" : String.valueOf(cfg.get("method"));
            String url = cfg.get("url") == null ? "" : String.valueOf(cfg.get("url"));
            Object status = context.getVariable("status");
            String s = status == null ? "" : String.valueOf(status);
            return "HTTP " + method.toUpperCase() + " " + url + " -> " + s;
        }

        if (t.equals("CONDITIONAL")) {
            Map<String, Object> cfg = safeConfig(node);
            String cond = cfg.get("condition") == null ? "" : String.valueOf(cfg.get("condition"));
            Object b = context.getVariable("__branch");
            String branch = b == null ? "" : String.valueOf(b);
            if (cond.isBlank()) return "Resultado = " + branch;
            return "Condición: " + cond + " -> " + branch;
        }

        if (t.equals("COMMAND")) {
            Map<String, Object> cfg = safeConfig(node);
            String cmd = cfg.get("command") == null ? "" : String.valueOf(cfg.get("command"));
            String args = cfg.get("args") == null ? "" : String.valueOf(cfg.get("args"));
            String full = (args == null || args.isBlank()) ? cmd : (cmd + " " + args);

            Object out = context.getVariable("lastStdout");
            String stdout = out == null ? "" : String.valueOf(out).trim();
            String oneLine = stdout.replace("\r", "").replace("\n", " ").trim();
            if (oneLine.length() > 200) oneLine = oneLine.substring(0, 200) + "...";

            if (oneLine.isBlank()) return "Comando ejecutado: " + full;
            return "Comando: " + full + " | Salida: " + oneLine;
        }

        return "OK";
    }

    private String safeLabel(Node node) {
        try {
            if (node.data == null) return "";
            Object label = node.data.get("label");
            if (label != null) return String.valueOf(label);
        } catch (Exception ignored) {
        }
        return "";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> safeConfig(Node node) {
        try {
            if (node.data == null) return Map.of();
            Object cfg = node.data.get("config");
            if (cfg instanceof Map<?, ?> m) return (Map<String, Object>) m;
        } catch (Exception ignored) {
        }
        return Map.of();
    }

    private Node resolveNextNode(Workflow workflow, Node currentNode, ExecutionContext context) {
        String currentId = currentNode.id;
        String branch = null;

        if (currentNode.type != null && currentNode.type.equalsIgnoreCase("CONDITIONAL")) {
            Object b = context.getVariable("__branch");
            if (b != null) branch = String.valueOf(b);
        }

        if (workflow == null || workflow.nodes == null) return null;
        if (workflow.edges == null) return null;

        Optional<Connection> edge;
        if (branch == null) {
            edge = workflow.edges.stream()
                .filter(e -> e.source != null && e.source.equals(currentId))
                .findFirst();
        } else {
            final String branchFinal = branch;
            edge = workflow.edges.stream()
                .filter(e -> e.source != null && e.source.equals(currentId)
                    && ((e.label != null && e.label.equalsIgnoreCase(branchFinal))
                        || (e.sourceHandle != null && e.sourceHandle.equalsIgnoreCase(branchFinal))))
                .findFirst();
        }

        if (edge.isPresent()) {
            String nextId = edge.get().target;
            return workflow.nodes.stream().filter(n -> n.id.equals(nextId)).findFirst().orElse(null);
        }
        return null;
    }
}
