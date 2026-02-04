package com.miniflow.strategies;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

public class EndStrategy implements NodeExecutor {
    @Override
    public void execute(Node node, ExecutionContext context) {
        System.out.println("SUCCESS: Node " + node.id + " END");
    }
}
