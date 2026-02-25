package com.miniflow.strategies;

import static org.junit.jupiter.api.Assertions.*;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Connection;
import com.miniflow.model.Node;
import com.miniflow.model.Workflow;
import com.miniflow.utils.HttpHelper;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class IntegrationLikeStrategiesTest {

    private static HttpServer server;
    private static String baseUrl;

    private static Node node(String id, String type, Map<String, Object> config) {
        Node node = new Node();
        node.id = id;
        node.type = type;
        node.data = new HashMap<>();
        node.data.put("config", config);
        return node;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> nodeOutput(ExecutionContext ctx, String nodeId) {
        return (Map<String, Object>) ctx.getNodeOutput(nodeId);
    }

    @BeforeAll
    static void startServer() throws Exception {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/ok", exchange -> writeResponse(exchange, 200, "{\"status\":200,\"data\":{\"name\":\"Ana\"}}"));
        server.createContext("/err", exchange -> writeResponse(exchange, 500, "{\"error\":\"boom\"}"));
        server.start();
        baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
    }

    @AfterAll
    static void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    private static void writeResponse(com.sun.net.httpserver.HttpExchange exchange, int status, String body)
            throws IOException {
        byte[] bytes = body.getBytes();
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    @Test
    void httpHelperUtilityMethodsWork() {
        assertTrue(HttpHelper.methodSupportsBody("post"));
        assertFalse(HttpHelper.methodSupportsBody("get"));
        assertTrue(HttpHelper.isError(500));
        assertFalse(HttpHelper.isError(200));
    }

    @Test
    void httpHelperThrowsWhenNoUrlCanBeExecuted() {
        Exception ex = assertThrows(
                Exception.class,
                () -> HttpHelper.executeWithRetries(List.of(), "GET", null, Map.of(), 100, 0)
        );
        assertTrue(ex.getMessage().contains("HTTP Request failed"));
    }

    @Test
    void httpRequestStrategyMapsResponseToContext() throws Exception {
        HttpRequestStrategy strategy = new HttpRequestStrategy();
        ExecutionContext context = new ExecutionContext();
        context.setVariable("token", "abc");

        Node node = node("http-1", "HTTP_REQUEST", Map.of(
                "method", "GET",
                "url", baseUrl + "/ok",
                "headers", Map.of("X-Token", "{{token}}"),
                "timeoutMs", 1000,
                "retries", 0,
                "map", Map.of(
                        "status", "$.status",
                        "name", "$.data.name"
                )
        ));

        strategy.execute(node, context);

        assertEquals(200, context.getVariable("status"));
        assertEquals("Ana", context.getVariable("name"));
        assertEquals(200, nodeOutput(context, "http-1").get("status_code"));
    }

    @Test
    void httpRequestStrategyThrowsOnHttpError() {
        HttpRequestStrategy strategy = new HttpRequestStrategy();
        ExecutionContext context = new ExecutionContext();
        Node node = node("http-2", "HTTP_REQUEST", Map.of(
                "method", "GET",
                "url", baseUrl + "/err",
                "timeoutMs", 1000,
                "retries", 0
        ));

        Exception ex = assertThrows(Exception.class, () -> strategy.execute(node, context));
        assertTrue(ex.getMessage().contains("HTTP Error 500"));
        assertEquals(500, nodeOutput(context, "http-2").get("status_code"));
    }

    @Test
    void httpRequestStrategyUsesFallbackUrlWhenFirstFails() throws Exception {
        HttpRequestStrategy strategy = new HttpRequestStrategy();
        ExecutionContext context = new ExecutionContext();
        Node node = node("http-3", "HTTP_REQUEST", Map.of(
                "method", "GET",
                "url", "http://127.0.0.1:1/unavailable",
                "fallbackUrls", List.of(baseUrl + "/ok"),
                "timeoutMs", 200,
                "retries", 0,
                "map", Map.of("status", "$.status")
        ));

        strategy.execute(node, context);
        assertEquals(200, context.getVariable("status"));
    }

    @Test
    void commandStrategyExecutesAndStoresOutput() throws Exception {
        CommandStrategy strategy = new CommandStrategy();
        ExecutionContext context = new ExecutionContext();

        Node node = node("cmd-1", "COMMAND", Map.of(
                "command", "echo",
                "args", "hello-junit",
                "outputKey", "cmdOut",
                "timeoutMs", 2000
        ));

        strategy.execute(node, context);

        String out = String.valueOf(context.getVariable("cmdOut"));
        assertTrue(out.toLowerCase().contains("hello-junit"));
        assertEquals(0, nodeOutput(context, "cmd-1").get("exitCode"));
    }

    @Test
    void commandStrategyValidatesRequiredCommandAndScriptPath() {
        CommandStrategy strategy = new CommandStrategy();
        ExecutionContext context = new ExecutionContext();

        Node missingCommand = node("cmd-2", "COMMAND", Map.of("command", " "));
        Exception ex1 = assertThrows(Exception.class, () -> strategy.execute(missingCommand, context));
        assertTrue(ex1.getMessage().contains("Command is required"));

        Node badScript = node("cmd-3", "COMMAND", Map.of(
                "command", "python",
                "scriptPath", "C:/this/path/does/not/exist.py",
                "timeoutMs", 1000
        ));
        Exception ex2 = assertThrows(Exception.class, () -> strategy.execute(badScript, context));
        assertTrue(ex2.getMessage().contains("Script not found"));
    }

    @Test
    void parallelStrategyHandlesNoScopeNoBranchAndBranches() throws Exception {
        ParallelStrategy strategy = new ParallelStrategy();
        ExecutionContext context = new ExecutionContext();
        Node parallel = node("p1", "PARALLEL", Map.of());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> strategy.execute(parallel, context));
        assertTrue(ex.getMessage().contains("Scope del Workflow"));

        Workflow noBranchWorkflow = new Workflow();
        noBranchWorkflow.nodes = List.of(parallel);
        noBranchWorkflow.edges = List.of();
        context.setVariable("__workflowScope", noBranchWorkflow);
        strategy.execute(parallel, context);
        assertEquals("No hay ramas", nodeOutput(context, "p1").get("message"));

        Node end = node("end", "END", Map.of());
        Connection edge = new Connection();
        edge.source = "p1";
        edge.target = "end";
        Workflow workflow = new Workflow();
        workflow.nodes = List.of(parallel, end);
        workflow.edges = List.of(edge);
        context.setVariable("__workflowScope", workflow);
        strategy.execute(parallel, context);
        assertEquals(1, nodeOutput(context, "p1").get("branches_dispatched"));
    }
}
