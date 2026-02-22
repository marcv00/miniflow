package com.miniflow.strategies;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.util.Map;

/**
 * Base class for all node executors — extracts common helpers (DRY principle).
 * 
 * Subclasses only need to implement execute(). They can use:
 * - extractConfig(node) → typed config map
 * - asString(value) → safe string conversion
 * - asInt(value, def) → safe int with default
 * - asLong(value, def) → safe long with default
 * - resolveTemplate(text, context) → replace {{context.var}} placeholders
 */
public abstract class AbstractNodeExecutor implements NodeExecutor {

    /**
     * Extracts the config map from node, handling both ReactFlow and portable
     * format.
     */
    protected Map<String, Object> extractConfig(Node node) {
        return node.getEffectiveConfig();
    }

    /**
     * Safely converts a value to String.
     */
    protected String asString(Object value) {
        if (value == null)
            return null;
        return value.toString().trim();
    }

    /**
     * Safely converts a value to int with a default.
     */
    protected int asInt(Object value, int defaultValue) {
        if (value == null)
            return defaultValue;
        if (value instanceof Number)
            return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Safely converts a value to long with a default.
     */
    protected long asLong(Object value, long defaultValue) {
        if (value == null)
            return defaultValue;
        if (value instanceof Number)
            return ((Number) value).longValue();
        try {
            return Long.parseLong(value.toString().trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * Resolves {{context.varName}} placeholders in a string using the execution
     * context.
     */
    protected String resolveTemplate(String text, ExecutionContext context) {
        if (text == null)
            return null;
        String result = text;
        // Replace all {{context.XXX}} with context values
        while (result.contains("{{context.")) {
            int start = result.indexOf("{{context.");
            int end = result.indexOf("}}", start);
            if (end == -1)
                break;

            String varName = result.substring(start + "{{context.".length(), end);
            Object val = context.getVariable(varName);
            String replacement = val != null ? val.toString() : "";

            result = result.substring(0, start) + replacement + result.substring(end + 2);
        }
        return result;
    }
}
