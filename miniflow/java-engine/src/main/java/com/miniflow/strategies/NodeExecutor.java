package com.miniflow.strategies;

import com.miniflow.model.Node;
import com.miniflow.context.ExecutionContext;

public interface NodeExecutor {
    void execute(Node node, ExecutionContext context) throws Exception;
}
