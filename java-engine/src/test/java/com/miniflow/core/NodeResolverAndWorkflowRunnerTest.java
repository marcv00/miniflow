package com.miniflow.core;

import static org.junit.jupiter.api.Assertions.*;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Connection;
import com.miniflow.model.Node;
import com.miniflow.model.Workflow;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class NodeResolverAndWorkflowRunnerTest {

    private static Node node(String id, String type) {
        Node node = new Node();
        node.id = id;
        node.type = type;
        node.data = new HashMap<>();
        node.data.put("config", new HashMap<String, Object>());
        node.data.put("label", id);
        return node;
    }

    private static Connection edge(String source, String target, String label) {
        Connection edge = new Connection();
        edge.source = source;
        edge.target = target;
        edge.label = label;
        return edge;
    }

    @Test
    void findStartNodeAndResolveNextByBranch() {
        Workflow workflow = new Workflow();
        Node start = node("start", "START");
        Node conditional = node("cond", "CONDITIONAL");
        Node onTrue = node("true-node", "END");
        Node onFalse = node("false-node", "END");
        workflow.nodes = List.of(start, conditional, onTrue, onFalse);
        workflow.edges = List.of(
                edge("start", "cond", null),
                edge("cond", "true-node", "TRUE"),
                edge("cond", "false-node", "FALSE")
        );

        ExecutionContext context = new ExecutionContext();
        context.setNodeOutput("cond", Map.of("selectedBranch", "FALSE"));

        assertEquals(start, NodeResolver.findStartNode(workflow));
        assertEquals(conditional, NodeResolver.resolveNext(workflow, start, context));
        assertEquals(onFalse, NodeResolver.resolveNext(workflow, conditional, context));
    }

    @Test
    void resolverHandlesEdgeCases() {
        Workflow workflow = new Workflow();
        Node parallel = node("p", "PARALLEL");
        workflow.nodes = List.of(parallel);
        workflow.edges = List.of();

        assertNull(NodeResolver.resolveNext(null, parallel, new ExecutionContext()));
        assertNull(NodeResolver.resolveNext(workflow, parallel, new ExecutionContext()));
        assertThrows(RuntimeException.class, () -> NodeResolver.findStartNode(workflow));
    }

    @Test
    void runFromNodeContinuesWhenPolicyIsNotStop() {
        Workflow workflow = new Workflow();
        Node bad = node("bad", "UNKNOWN");
        @SuppressWarnings("unchecked")
        Map<String, Object> badCfg = (Map<String, Object>) bad.data.get("config");
        badCfg.put("errorPolicy", "CONTINUE_ON_FAIL");
        Node end = node("end", "END");
        workflow.nodes = List.of(bad, end);
        workflow.edges = List.of(edge("bad", "end", null));

        ExecutionContext context = new ExecutionContext();
        new WorkflowRunner().runFromNode(workflow, bad, context);

        assertSame(workflow, context.getVariable("__workflowScope"));
        assertNotNull(context.getVariable("__lastError"));
        assertNotNull(context.getNodeOutput("bad"));
        assertNotNull(context.getNodeOutput("end"));
    }

    @Test
    void runPrintsFinalSuccessEvent() {
        Workflow workflow = new Workflow();
        workflow.name = "JUnitFlow";
        Node start = node("s", "START");
        Node end = node("e", "END");
        workflow.nodes = List.of(start, end);
        workflow.edges = List.of(edge("s", "e", null));

        PrintStream oldOut = System.out;
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        System.setOut(new PrintStream(output));
        try {
            new WorkflowRunner().run(workflow);
        } finally {
            System.setOut(oldOut);
        }

        String stdout = output.toString();
        assertTrue(stdout.contains("WORKFLOW_FINISHED"));
        assertTrue(stdout.contains("\"status\": \"SUCCESS\""));
    }

    @Test
    void runPrintsFailedStatusWhenNodeErrors() {
        Workflow workflow = new Workflow();
        workflow.name = "FailFlow";
        Node start = node("s", "START");
        Node bad = node("b", "UNKNOWN");
        workflow.nodes = List.of(start, bad);
        workflow.edges = List.of(edge("s", "b", null));

        PrintStream oldOut = System.out;
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        System.setOut(new PrintStream(output));
        try {
            new WorkflowRunner().run(workflow);
        } finally {
            System.setOut(oldOut);
        }

        String stdout = output.toString();
        assertTrue(stdout.contains("WORKFLOW_FINISHED"));
        assertTrue(stdout.contains("\"status\": \"FAILED\""));
    }
}
