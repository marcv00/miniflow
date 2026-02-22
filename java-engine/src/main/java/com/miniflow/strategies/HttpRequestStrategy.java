package com.miniflow.strategies;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

/**
 * Executes HTTP requests with retry support, query params, and timeout.
 *
 * RF-B07: Execute HTTP_REQUEST nodes.
 * RF-B13: Support timeout.
 * RF-B14: Support retries.
 */
public class HttpRequestStrategy extends AbstractNodeExecutor {

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String method = asString(config.getOrDefault("method", "GET")).toUpperCase();
        String url = asString(config.get("url"));
        long timeoutMs = asLong(config.getOrDefault("timeoutMs", 5000), 5000);
        int retries = asInt(config.getOrDefault("retries", 0), 0);
        String headersStr = asString(config.get("headers"));
        String queryParamsStr = asString(config.get("queryParams"));
        Object bodyObj = config.get("body");
        Object mappingObj = config.get("outputMapping");
        if (mappingObj == null)
            mappingObj = config.get("map");

        if (url == null || url.isBlank())
            throw new Exception("Missing URL in HTTP node");

        // Resolve template variables in URL
        url = resolveTemplate(url, context);

        // RF-B14: Append query params
        if (queryParamsStr != null && !queryParamsStr.isBlank()) {
            url = appendQueryParams(url, queryParamsStr);
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(timeoutMs))
                .build();

        // Parse headers
        Map<String, Object> headers = parseJsonMap(headersStr);

        // RF-B14: Retry loop
        Exception lastException = null;
        for (int attempt = 0; attempt <= retries; attempt++) {
            try {
                HttpRequest.Builder builder = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofMillis(timeoutMs));

                // Apply headers
                for (Map.Entry<String, Object> e : headers.entrySet()) {
                    builder.header(e.getKey(), String.valueOf(e.getValue()));
                }

                // Set method and body
                if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) {
                    String body = bodyObj == null ? "" : resolveTemplate(String.valueOf(bodyObj), context);
                    builder.method(method, HttpRequest.BodyPublishers.ofString(body));
                } else {
                    builder.method(method, HttpRequest.BodyPublishers.noBody());
                }

                HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());

                int status = response.statusCode();
                String body = response.body();

                context.setVariable("httpStatus", status);
                context.setVariable("status", status);
                context.setVariable("httpBody", body);

                if (status >= 400)
                    throw new Exception("HTTP_ERROR: " + status);

                // Optional mapping
                if (mappingObj instanceof Map<?, ?> map) {
                    for (Map.Entry<?, ?> e : map.entrySet()) {
                        String key = String.valueOf(e.getKey());
                        String path = String.valueOf(e.getValue());
                        Object value = resolveMapping(path, status, body);
                        context.setVariable(key, value);
                    }
                }

                return; // Success — exit retry loop

            } catch (Exception ex) {
                lastException = ex;
                if (attempt < retries) {
                    System.err.println("  Retry " + (attempt + 1) + "/" + retries + " after error: " + ex.getMessage());
                    Thread.sleep(Math.min(1000L * (attempt + 1), 3000));
                }
            }
        }

        throw new Exception("NETWORK_ERROR after " + (retries + 1) + " attempts: "
                + (lastException != null ? lastException.getMessage() : "unknown"));
    }

    // ─── Helpers ────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank())
            return Map.of();
        try {
            Object parsed = mapper.readValue(json, Object.class);
            if (parsed instanceof Map)
                return (Map<String, Object>) parsed;
        } catch (Exception ignored) {
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    private String appendQueryParams(String url, String queryParamsStr) {
        try {
            Object parsed = mapper.readValue(queryParamsStr, Object.class);
            if (parsed instanceof Map<?, ?> map) {
                StringBuilder sb = new StringBuilder(url);
                sb.append(url.contains("?") ? "&" : "?");
                boolean first = true;
                for (Map.Entry<?, ?> e : map.entrySet()) {
                    if (!first)
                        sb.append("&");
                    sb.append(URLEncoder.encode(String.valueOf(e.getKey()), StandardCharsets.UTF_8));
                    sb.append("=");
                    sb.append(URLEncoder.encode(String.valueOf(e.getValue()), StandardCharsets.UTF_8));
                    first = false;
                }
                return sb.toString();
            }
        } catch (Exception ignored) {
        }
        return url;
    }

    private Object resolveMapping(String path, int status, String body) {
        if ("$.body".equals(path))
            return body;
        if ("$.status".equals(path))
            return status;
        if ("$.statusCode".equals(path))
            return status;

        try {
            Object parsed = mapper.readValue(body, Object.class);
            if (parsed instanceof Map<?, ?> map) {
                String key = path.startsWith("$.") ? path.substring(2) : path;
                return map.get(key);
            }
        } catch (Exception ignored) {
        }

        return null;
    }
}
