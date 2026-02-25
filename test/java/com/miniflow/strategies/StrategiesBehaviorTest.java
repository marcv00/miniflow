package com.miniflow.strategies;

import static org.junit.jupiter.api.Assertions.*;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class StrategiesBehaviorTest {

    @TempDir
    Path tempDir;

    @SuppressWarnings("unchecked")
    private static Map<String, Object> nodeOutput(ExecutionContext ctx, String nodeId) {
        return (Map<String, Object>) ctx.getNodeOutput(nodeId);
    }

    private static Node node(String id, String type, Map<String, Object> config) {
        Node node = new Node();
        node.id = id;
        node.type = type;
        node.data = new HashMap<>();
        node.data.put("config", config);
        return node;
    }

    @Test
    void startStrategyStoresInitialSnapshot() throws Exception {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("__workflowStartTime", 123L);
        context.setVariable("payload", Map.of("id", 1));

        Node start = node("start-1", "START", Map.of());
        new StartStrategy().execute(start, context);

        Map<String, Object> output = nodeOutput(context, "start-1");
        assertEquals("Workflow execution started", output.get("message"));
        assertEquals(123L, output.get("systemStartTime"));
        assertNotNull(output.get("initialState"));
    }

    @Test
    void endStrategyStoresFinalStats() throws Exception {
        ExecutionContext context = new ExecutionContext();
        long startTime = System.currentTimeMillis() - 20L;
        context.setVariable("__workflowStartTime", startTime);

        Node end = node("end-1", "END", Map.of());
        new EndStrategy().execute(end, context);

        Map<String, Object> output = nodeOutput(context, "end-1");
        assertEquals("SUCCESS", output.get("finalStatus"));
        @SuppressWarnings("unchecked")
        Map<String, Object> stats = (Map<String, Object>) output.get("executionStats");
        assertTrue(((Number) stats.get("durationMs")).longValue() >= 0L);
    }

    @Test
    void conditionalStrategyEvaluatesAndSelectsBranch() throws Exception {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("status", 200);

        Node cond = node("cond-1", "CONDITIONAL", Map.of("condition", "context.status == 200"));
        new ConditionalStrategy().execute(cond, context);

        Map<String, Object> output = nodeOutput(context, "cond-1");
        assertEquals(true, output.get("result"));
        assertEquals("TRUE", output.get("selectedBranch"));
    }

    @Test
    void conditionalStrategyFailsWhenConditionMissing() {
        ExecutionContext context = new ExecutionContext();
        Node cond = node("cond-2", "CONDITIONAL", Map.of());

        Exception ex = assertThrows(Exception.class, () -> new ConditionalStrategy().execute(cond, context));
        assertTrue(ex.getMessage().contains("requires a 'condition'"));
    }

    @Test
    void timerStrategyCalculatesWaitTime() throws Exception {
        ExecutionContext context = new ExecutionContext();
        Node timer = node("timer-1", "TIMER", Map.of("delay", 2, "unit", "ms"));

        new TimerStrategy().execute(timer, context);

        Map<String, Object> output = nodeOutput(context, "timer-1");
        assertEquals(2L, output.get("waited_ms"));
    }

    @Test
    void createFolderStrategyCreatesAndReusesFolder() throws Exception {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("env", "dev");

        Node createFolder = node("folder-1", "CREATE_FOLDER", Map.of(
                "folderName", "reports_{{env}}",
                "folderPath", tempDir.toString()
        ));

        CreateFolderStrategy strategy = new CreateFolderStrategy();
        strategy.execute(createFolder, context);

        String createdPath = (String) context.getVariable("lastCreatedFolder");
        assertNotNull(createdPath);
        assertTrue(Path.of(createdPath).toFile().exists());
        assertEquals("CREATED", nodeOutput(context, "folder-1").get("status"));

        strategy.execute(createFolder, context);
        assertEquals("EXISTED", nodeOutput(context, "folder-1").get("status"));
    }

    @Test
    void createFolderStrategyFailsWithMissingData() {
        ExecutionContext context = new ExecutionContext();
        Node node = node("folder-2", "CREATE_FOLDER", Map.of("folderName", "x"));

        Exception ex = assertThrows(Exception.class, () -> new CreateFolderStrategy().execute(node, context));
        assertTrue(ex.getMessage().contains("Missing folderName or folderPath"));
    }

    @Test
    void executionResultFactoriesWork() {
        ExecutionResult ok = ExecutionResult.success("Done", Map.of("k", "v"));
        ExecutionResult fail = ExecutionResult.fail("boom");

        assertTrue(ok.isSuccess());
        assertEquals("Done", ok.getSummary());
        assertEquals(Map.of("k", "v"), ok.getOutputData());
        assertNull(ok.getError());

        assertFalse(fail.isSuccess());
        assertEquals("boom", fail.getError());
        assertTrue(fail.getSummary().contains("ERROR: boom"));
    }

    @Test
    void loggingDecoratorLogsAndFiltersInternalVariables() throws Exception {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("__internal", "secret");
        context.setVariable("publicKey", "visible");
        Node node = node("log-1", "COMMAND", Map.of("command", "echo ok"));

        LoggingNodeDecorator decorator = new LoggingNodeDecorator((n, ctx) -> ctx.setNodeOutput(n.id, Map.of("ok", true)));

        PrintStream oldOut = System.out;
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        System.setOut(new PrintStream(output));
        try {
            decorator.execute(node, context);
        } finally {
            System.setOut(oldOut);
        }

        String log = output.toString();
        assertTrue(log.contains("publicKey"));
        assertFalse(log.contains("__internal"));
    }

    @Test
    void loggingDecoratorPropagatesWrappedErrors() {
        ExecutionContext context = new ExecutionContext();
        Node node = node("log-2", "COMMAND", Map.of("command", "bad"));
        LoggingNodeDecorator decorator = new LoggingNodeDecorator((n, ctx) -> {
            throw new RuntimeException("forced failure");
        });

        Exception ex = assertThrows(Exception.class, () -> decorator.execute(node, context));
        assertTrue(ex.getMessage().contains("forced failure"));
    }
}
