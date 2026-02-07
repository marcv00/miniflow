package com.miniflow.strategies;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class HttpRequestStrategy implements NodeExecutor {
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String method = asString(config.getOrDefault("method", "GET"));
        String url = asString(config.get("url"));
        Object fallbackObj = config.get("fallbackUrls");
        Integer timeoutMs = asInt(config.getOrDefault("timeoutMs", 5000));
        Integer retries = asInt(config.getOrDefault("retries", 0));
        Object headersObj = config.get("headers");
        Object bodyObj = config.get("body");
        Object mappingObj = config.get("outputMapping");
        if (mappingObj == null) mappingObj = config.get("map");

        if (url == null || url.isBlank()) throw new Exception("Missing url in node config");

        List<String> urls = new ArrayList<>();
        urls.add(url);
        if (fallbackObj instanceof List<?> list) {
            for (Object u : list) {
                if (u == null) continue;
                String s = String.valueOf(u);
                if (!s.isBlank()) urls.add(s);
            }
        }

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofMillis(timeoutMs)).build();

        Exception last = null;

        for (String currentUrl : urls) {
            int attempts = 0;
            while (attempts <= retries) {
                attempts++;
                try {
                    HttpRequest.Builder b = HttpRequest.newBuilder()
                        .uri(URI.create(currentUrl))
                        .timeout(Duration.ofMillis(timeoutMs));

                    if (headersObj instanceof Map<?, ?> hm) {
                        for (Map.Entry<?, ?> e : hm.entrySet()) {
                            if (e.getKey() != null && e.getValue() != null) {
                                b.header(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
                            }
                        }
                    }

                    if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
                        String body = bodyObj == null ? "" : String.valueOf(bodyObj);
                        b.method(method.toUpperCase(), HttpRequest.BodyPublishers.ofString(body));
                    } else {
                        b.method(method.toUpperCase(), HttpRequest.BodyPublishers.noBody());
                    }

                    HttpResponse<String> resp = client.send(b.build(), HttpResponse.BodyHandlers.ofString());
                    int httpStatus = resp.statusCode();
                    String body = resp.body();

                    context.setVariable("httpStatus", httpStatus);
                    context.setVariable("status", httpStatus);
                    context.setVariable("httpBody", body);

                    if (mappingObj instanceof Map<?, ?> mm) {
                        for (Map.Entry<?, ?> e : mm.entrySet()) {
                            if (e.getKey() == null || e.getValue() == null) continue;
                            String key = String.valueOf(e.getKey());
                            String path = String.valueOf(e.getValue());
                            Object value = resolveMapping(path, httpStatus, body);
                            context.setVariable(key, value);
                        }
                    }

                    if (isHttpError(httpStatus) && isStopOnFail(config)) {
                        throw new Exception("HTTP " + httpStatus + " en " + currentUrl);
                    }

                    return;
                } catch (Exception ex) {
                    last = ex;
                }
            }
        }

        throw last == null ? new Exception("HTTP request failed") : last;
    }

    private Object resolveMapping(String path, int httpStatus, String body) {
        if (path == null || path.isBlank()) return null;
        if ("$.body".equals(path)) return body;

        Object parsed = tryParseJson(body);

        if ("$.status".equals(path)) {
            Object statusFromBody = extractFromParsed(parsed, "status");
            if (statusFromBody != null) return normalizeValue(statusFromBody);
            return httpStatus;
        }

        if ("$.data".equals(path)) {
            Object v = extractFromParsed(parsed, "data");
            if (v == null) v = extractFromParsed(parsed, "payload");
            return normalizeValue(v);
        }

        if ("$.payload".equals(path)) {
            Object v = extractFromParsed(parsed, "payload");
            if (v == null) v = extractFromParsed(parsed, "data");
            return normalizeValue(v);
        }

        if (path.startsWith("$.") && parsed != null) {
            Object v = extractFromParsed(parsed, path.substring(2));
            return normalizeValue(v);
        }

        return null;
    }

    private Object tryParseJson(String body) {
        try {
            if (body == null || body.isBlank()) return null;
            return mapper.readValue(body, Object.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Object extractFromParsed(Object parsed, String dottedPath) {
        if (parsed == null || dottedPath == null || dottedPath.isBlank()) return null;

        String[] parts = dottedPath.split("\\.");
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

    private Object normalizeValue(Object value) {
        if (value == null) return null;

        if (value instanceof String s) {
            String t = s.trim();
            if (t.matches("^-?\\d+$")) {
                try {
                    return Integer.parseInt(t);
                } catch (Exception ignored) {
                }
            }
            if (t.matches("^-?\\d+\\.\\d+$")) {
                try {
                    return Double.parseDouble(t);
                } catch (Exception ignored) {
                }
            }
            return s;
        }

        return value;
    }


    private boolean isHttpError(int status) {
        return status >= 400;
    }

    private boolean isStopOnFail(Map<String, Object> config) {
        if (config == null) return true;

        Object policy = config.get("errorPolicy");
        if (policy == null) policy = config.get("onError");
        if (policy == null) return true;

        String p = String.valueOf(policy).trim();
        if (p.isBlank()) return true;
        return p.equalsIgnoreCase("STOP_ON_FAIL") || p.equalsIgnoreCase("STOP");
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
        try {
            return Integer.parseInt(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }
}
