package com.miniflow.strategies;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

public class HttpRequestStrategy implements NodeExecutor {
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String method = asString(config.getOrDefault("method", "GET"));
        String url = asString(config.get("url"));
        Integer timeoutMs = asInt(config.getOrDefault("timeoutMs", 5000));
        Integer retries = asInt(config.getOrDefault("retries", 0));
        Object headersObj = config.get("headers");
        Object bodyObj = config.get("body");
        Object mappingObj = config.get("outputMapping");
        if (mappingObj == null) mappingObj = config.get("map");

        if (url == null || url.isBlank()) throw new Exception("Missing url in node config");

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(timeoutMs)).build();

        int attempts = 0;
        Exception last = null;

        while (attempts <= retries) {
            attempts++;
            try {
                HttpRequest.Builder b = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(timeoutMs));

                if (headersObj instanceof Map<?, ?> hm) {
                    for (Map.Entry<?, ?> e : hm.entrySet()) {
                        if (e.getKey() != null && e.getValue() != null) b.header(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
                    }
                }

                if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
                    String body = bodyObj == null ? "" : String.valueOf(bodyObj);
                    b.method(method.toUpperCase(), HttpRequest.BodyPublishers.ofString(body));
                } else {
                    b.method(method.toUpperCase(), HttpRequest.BodyPublishers.noBody());
                }

                HttpResponse<String> resp = client.send(b.build(), HttpResponse.BodyHandlers.ofString());
                int status = resp.statusCode();
                String body = resp.body();

                context.setVariable("status", status);
                context.setVariable("httpBody", body);

                if (mappingObj instanceof Map<?, ?> mm) {
                    for (Map.Entry<?, ?> e : mm.entrySet()) {
                        if (e.getKey() == null || e.getValue() == null) continue;
                        String key = String.valueOf(e.getKey());
                        String path = String.valueOf(e.getValue());
                        Object value = resolveMapping(path, status, body);
                        context.setVariable(key, value);
                    }
                }

                System.out.println("SUCCESS: Node " + node.id + " HTTP " + method.toUpperCase() + " " + url + " -> " + status);
                return;
            } catch (Exception ex) {
                last = ex;
            }
        }

        throw last == null ? new Exception("HTTP request failed") : last;
    }

    private Object resolveMapping(String path, int status, String body) {
        try {
            if ("$.status".equals(path)) return status;
            if ("$.body".equals(path)) return body;

            if (path != null && path.startsWith("$.") && body != null && !body.isBlank()) {
                Object parsed = mapper.readValue(body, Object.class);
                String[] parts = path.substring(2).split("\\.");
                Object cur = parsed;
                for (String p : parts) {
                    if (cur instanceof Map<?, ?> m) {
                        cur = m.get(p);
                    } else {
                        return null;
                    }
                }
                return cur;
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private Map<String, Object> extractConfig(Node node) {
        if (node.data == null) return Map.of();
        Object nested = node.data.get("config");
        if (nested instanceof Map<?, ?> m) return (Map<String, Object>) m;
        return node.data;
    }

    private String asString(Object v) {
        if (v == null) return null;
        return String.valueOf(v);
    }

    private Integer asInt(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(v)); } catch (Exception e) { return null; }
    }
}
