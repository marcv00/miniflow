package com.miniflow.core;

import com.miniflow.model.*;
import com.miniflow.factory.ExecutorFactory;
import com.miniflow.context.ExecutionContext;
import java.util.Optional;

public class WorkflowRunner {
    public void run(Workflow workflow) {
        ExecutionContext context = ExecutionContext.getInstance();
        
        Node currentNode = workflow.nodes.stream()
            .filter(n -> n.type != null && n.type.equalsIgnoreCase("START")).findFirst()
            .orElseThrow(() -> new RuntimeException("No START node found"));

        while (currentNode != null) {
            try {
                System.out.println("Executing node: " + currentNode.id);
                ExecutorFactory.getExecutor(currentNode.type).execute(currentNode, context);

                if (currentNode.type != null && currentNode.type.equalsIgnoreCase("END")) break;

                currentNode = resolveNextNode(workflow, currentNode, context);
            } catch (Exception e) {
                System.err.println("Error: " + e.getMessage());
                String policy = resolveErrorPolicy(currentNode);
                if (policy != null && policy.equalsIgnoreCase("CONTINUE_ON_FAIL")) {
                    currentNode = resolveNextNode(workflow, currentNode, context);
                } else {
                    break;
                }
            }
        }
    }

    private String resolveErrorPolicy(Node node) {
        if (node == null) return null;
        if (node.errorPolicy != null && !node.errorPolicy.isBlank()) return node.errorPolicy;
        try {
            if (node.data == null) return null;
            Object cfg = node.data.get("config");
            if (cfg instanceof java.util.Map<?, ?> m) {
                Object ep = m.get("errorPolicy");
                if (ep != null) return String.valueOf(ep);
            }
            Object ep2 = node.data.get("errorPolicy");
            if (ep2 != null) return String.valueOf(ep2);
        } catch (Exception ignored) {}
        return null;
    }

    private Node resolveNextNode(Workflow workflow, Node currentNode, ExecutionContext context) {
        String currentId = currentNode.id;
        String branch = null;

        if (currentNode.type != null && currentNode.type.equalsIgnoreCase("CONDITIONAL")) {
            Object b = context.getVariable("__branch");
            if (b != null) branch = String.valueOf(b);
        }

        Optional<Connection> edge;
        if (branch == null) {
            edge = workflow.edges.stream()
                .filter(e -> e.source != null && e.source.equals(currentId))
                .findFirst();
        } else {
            final String branchFinal = branch;
            edge = workflow.edges.stream()
                .filter(e -> e.source != null && e.source.equals(currentId)
                    && e.label != null && e.label.equalsIgnoreCase(branchFinal))
                .findFirst();
        }

        if (edge.isPresent()) {
            String nextId = edge.get().target;
            return workflow.nodes.stream().filter(n -> n.id.equals(nextId)).findFirst().orElse(null);
        }
        return null;
    }
}