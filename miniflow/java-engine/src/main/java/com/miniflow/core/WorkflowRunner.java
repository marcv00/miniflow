package com.miniflow.core;

import com.miniflow.model.*;
import com.miniflow.factory.ExecutorFactory;
import com.miniflow.context.ExecutionContext;
import java.util.Optional;

public class WorkflowRunner {
    public void run(Workflow workflow) {
        ExecutionContext context = ExecutionContext.getInstance();
        
        // 1. Find START node
        Node currentNode = workflow.nodes.stream()
            .filter(n -> n.type.equals("START")).findFirst()
            .orElseThrow(() -> new RuntimeException("No START node found"));

        // 2. Loop through nodes
        while (currentNode != null) {
            try {
                System.out.println("Executing node: " + currentNode.id);
                ExecutorFactory.getExecutor(currentNode.type).execute(currentNode, context);
                
                // 3. Find next node by looking at edges
                String currentId = currentNode.id;
                Optional<Connection> edge = workflow.edges.stream()
                    .filter(e -> e.source.equals(currentId)).findFirst();
                
                if (edge.isPresent()) {
                    String nextId = edge.get().target;
                    currentNode = workflow.nodes.stream()
                        .filter(n -> n.id.equals(nextId)).findFirst().orElse(null);
                } else {
                    currentNode = null; // End of flow
                }
            } catch (Exception e) {
                System.err.println("Error: " + e.getMessage());
                break; 
            }
        }
    }
}