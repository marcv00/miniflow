package com.miniflow.strategies;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.util.Map;

public class ConditionalStrategy implements NodeExecutor {
    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String condition = asString(config.get("condition"));
        if (condition == null) condition = asString(config.get("expression"));
        if (condition == null) throw new Exception("Missing condition in node config");

        boolean result = eval(condition, context);
        context.setVariable("__branch", result ? "TRUE" : "FALSE");
    }

    private boolean eval(String expr, ExecutionContext context) {
        String s = expr.trim();
        String op = s.contains("==") ? "==" : s.contains("!=") ? "!=" : null;
        if (op == null) return false;

        String[] parts = s.split(op, 2);
        if (parts.length != 2) return false;

        String left = parts[0].trim();
        String right = parts[1].trim();

        if (left.startsWith("context.")) left = left.substring("context.".length());

        Object lv = context.getVariable(left);
        Object rv = parseLiteral(right);

        if (lv == null && rv == null) return "==".equals(op);
        if (lv == null || rv == null) return "!=".equals(op);

        if (lv instanceof Number && rv instanceof Number) {
            double a = ((Number) lv).doubleValue();
            double b = ((Number) rv).doubleValue();
            return "==".equals(op) ? a == b : a != b;
        }

        String a = String.valueOf(lv);
        String b = String.valueOf(rv);
        return "==".equals(op) ? a.equals(b) : !a.equals(b);
    }

    private Object parseLiteral(String raw) {
        String r = raw.trim();
        if ((r.startsWith("\"") && r.endsWith("\"")) || (r.startsWith("'") && r.endsWith("'"))) {
            return r.substring(1, r.length() - 1);
        }
        if ("true".equalsIgnoreCase(r)) return true;
        if ("false".equalsIgnoreCase(r)) return false;
        try { return Integer.parseInt(r); } catch (Exception ignored) {}
        try { return Double.parseDouble(r); } catch (Exception ignored) {}
        return r;
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
}
