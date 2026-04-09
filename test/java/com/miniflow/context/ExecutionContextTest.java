package com.miniflow.context;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;
import org.junit.jupiter.api.Test;

class ExecutionContextTest {

    @Test
    void storesVariablesAndNodeOutputs() {
        ExecutionContext context = new ExecutionContext();

        context.setVariable("status", 200);
        context.setNodeOutput("node-1", Map.of("ok", true));

        assertEquals(200, context.getVariable("status"));
        assertEquals(Map.of("ok", true), context.getNodeOutput("node-1"));
    }

    @Test
    void ignoresNullVariableKey() {
        ExecutionContext context = new ExecutionContext();
        context.setVariable(null, "value");
        assertTrue(context.getVariables().isEmpty());
    }

    @Test
    void cloneContextCreatesIndependentCopy() {
        ExecutionContext original = new ExecutionContext();
        original.setVariable("a", 1);
        original.setNodeOutput("n1", Map.of("done", true));

        ExecutionContext clone = original.cloneContext();
        original.setVariable("a", 2);
        original.setNodeOutput("n2", Map.of("done", false));

        assertEquals(1, clone.getVariable("a"));
        assertEquals(Map.of("done", true), clone.getNodeOutput("n1"));
        assertNull(clone.getNodeOutput("n2"));
    }

    @Test
    void clearRemovesAllData() {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("x", 1);
        context.setNodeOutput("node", Map.of("key", "value"));

        context.clear();

        assertTrue(context.getVariables().isEmpty());
        assertNull(context.getNodeOutput("node"));
    }
}
