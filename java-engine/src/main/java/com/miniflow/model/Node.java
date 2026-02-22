package com.miniflow.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.LinkedHashMap;
import java.util.Map;

public class Node {
    public String id;
    public String type;
    public Map<String, Object> data; // Config from React (nested: data.config.url)
    public String errorPolicy; // STOP_ON_FAIL or CONTINUE_ON_FAIL
    public String label;

    // Direct portable-format fields (flat: config.url)
    @JsonProperty("config")
    public Map<String, Object> config;

    public Map<String, Object> position;
    public Integer width;
    public Integer height;

    /**
     * Returns the effective config, checking both data.config (ReactFlow)
     * and top-level config (portable JSON format).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getEffectiveConfig() {
        // 1. Try data.config (ReactFlow internal format)
        if (data != null) {
            Object cfg = data.get("config");
            if (cfg instanceof Map) {
                return (Map<String, Object>) cfg;
            }
        }
        // 2. Try top-level config (portable format)
        if (config != null && !config.isEmpty()) {
            return config;
        }
        // 3. Fallback to data itself
        if (data != null) {
            return new LinkedHashMap<>(data);
        }
        return new LinkedHashMap<>();
    }
}