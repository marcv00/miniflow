package com.miniflow.model;

import static org.junit.jupiter.api.Assertions.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ModelBehaviorTest {

    @Test
    void nodeProvidesSafeDefaults() {
        Node node = new Node();
        node.id = "n1";

        assertEquals("unknown", node.getType());
        assertEquals(Map.of(), node.getConfig());
        assertEquals("STOP", node.getErrorPolicy());
        assertEquals("n1", node.getLabel());
    }

    @Test
    void nodeReadsConfigAndPoliciesFromData() {
        Node node = new Node();
        node.id = "n2";
        node.type = "COMMAND";

        Map<String, Object> config = new HashMap<>();
        config.put("errorPolicy", "continue_on_fail");
        config.put("command", "echo hi");
        node.data = Map.of("label", "Comando", "config", config);

        assertEquals("COMMAND", node.getType());
        assertEquals("Comando", node.getLabel());
        assertEquals("CONTINUE_ON_FAIL", node.getErrorPolicy());
        assertEquals("echo hi", node.getConfig().get("command"));
    }

    @Test
    void nodeUsesOnErrorAliasWhenPolicyMissing() {
        Node node = new Node();
        node.data = Map.of("onError", "stop_on_fail");

        assertEquals("STOP_ON_FAIL", node.getErrorPolicy());
    }

    @Test
    void connectionMatchesBranchByLabelOrHandle() {
        Connection connection = new Connection();
        connection.label = "TRUE";
        connection.sourceHandle = "false";

        assertTrue(connection.matchesBranch(null));
        assertTrue(connection.matchesBranch("true"));
        assertTrue(connection.matchesBranch("FALSE"));
        assertFalse(connection.matchesBranch("OTHER"));
    }

    @Test
    void workflowFindsNodeById() {
        Workflow workflow = new Workflow();
        Node start = new Node();
        start.id = "start";
        Node end = new Node();
        end.id = "end";
        workflow.nodes = List.of(start, end);

        assertEquals(end, workflow.findNodeById("end"));
        assertNull(workflow.findNodeById("missing"));
    }
}
