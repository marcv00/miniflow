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
        Object headersObj = config.get("headers");
        Object bodyObj = config.get("body");
        Object mappingObj = config.get("outputMapping");
        if (mappingObj == null)
            mappingObj = config.get("map");

        if (url == null || url.isBlank())
            throw new Exception("Missing URL in HTTP node");

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .build();

        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(timeoutMs));

            if (headersObj instanceof Map<?, ?> headers) {
                for (Map.Entry<?, ?> e : headers.entrySet()) {
                    builder.header(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
                }
            }

            if ("POST".equalsIgnoreCase(method)
                    || "PUT".equalsIgnoreCase(method)
                    || "PATCH".equalsIgnoreCase(method)) {
                String body = bodyObj == null ? "" : String.valueOf(bodyObj);
                builder.method(method.toUpperCase(),
                        HttpRequest.BodyPublishers.ofString(body));
            } else {
                builder.method(method.toUpperCase(),
                        HttpRequest.BodyPublishers.noBody());
            }

            HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());

            int status = response.statusCode();
            String body = response.body();

            context.setVariable("httpStatus", status);
            context.setVariable("status", status);
            context.setVariable("httpBody", body);

            // ERROR CONDITIONS
            if (status >= 400)
                throw new Exception("HTTP_ERROR: " + status);

            if (body == null || body.trim().isEmpty())
                throw new Exception("EMPTY_BODY");

            // Optional mapping
            if (mappingObj instanceof Map<?, ?> map) {
                for (Map.Entry<?, ?> e : map.entrySet()) {
                    String key = String.valueOf(e.getKey());
                    String path = String.valueOf(e.getValue());
                    Object value = resolveMapping(path, status, body);
                    context.setVariable(key, value);
                }
            }

        } catch (Exception ex) {
            throw new Exception("NETWORK_ERROR: " + ex.getMessage(), ex);
        }
    }

    private Object resolveMapping(String path, int status, String body) {
        if ("$.body".equals(path))
            return body;
        if ("$.status".equals(path))
            return status;

        try {
            Object parsed = mapper.readValue(body, Object.class);
            if (parsed instanceof Map<?, ?> map) {
                return map.get(path.replace("$.", ""));
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractConfig(Node node) {
        if (node.data == null)
            return Map.of();
        Object cfg = node.data.get("config");
        if (cfg instanceof Map<?, ?> m)
            return (Map<String, Object>) m;
        return Map.of();
    }

    private String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private Integer asInt(Object v) {
        if (v instanceof Number n)
            return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }
}
