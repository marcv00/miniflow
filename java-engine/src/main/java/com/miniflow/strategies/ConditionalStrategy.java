package com.miniflow.strategies;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.util.Map;

/**
 * Evaluates conditions using left/right operands and operators.
 * Sets __branch = "TRUE" or "FALSE" in the context.
 *
 * RF-B09: Execute CONDITIONAL nodes.
 * Supports: ==, !=, >, <, >=, <=, contains
 */
public class ConditionalStrategy extends AbstractNodeExecutor {

    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        // Try structured operands first (leftOperand, operator, rightOperand)
        String leftOperand = asString(config.get("leftOperand"));
        String operator = asString(config.get("operator"));
        String rightOperand = asString(config.get("rightOperand"));

        boolean result;

        if (leftOperand != null && operator != null && rightOperand != null) {
            // Structured format
            String leftValue = resolveOperand(leftOperand, context);
            String rightValue = resolveOperand(rightOperand, context);
            result = evaluate(leftValue, operator, rightValue);
        } else {
            // Legacy: parse condition string "context.var == value"
            String condition = asString(config.get("condition"));
            if (condition == null || condition.isBlank()) {
                throw new Exception("Missing condition in CONDITIONAL node");
            }
            result = parseLegacyCondition(condition, context);
        }

        String branch = result ? "TRUE" : "FALSE";
        context.setVariable("__branch", branch);
        System.err.println("  Condicion evaluada: " + branch);
    }

    /**
     * Resolves an operand — if it exists as a context variable, use the value;
     * otherwise treat it as a literal.
     */
    private String resolveOperand(String operand, ExecutionContext context) {
        if (operand == null)
            return "";

        // Strip "context." prefix if present
        String varName = operand.startsWith("context.") ? operand.substring(8) : operand;

        // Try to resolve from context
        Object val = context.getVariable(varName);
        if (val != null)
            return String.valueOf(val);

        // Also try the original operand as-is
        Object val2 = context.getVariable(operand);
        if (val2 != null)
            return String.valueOf(val2);

        // Return as literal
        return operand;
    }

    /**
     * Evaluates two string values with the given operator.
     * Attempts numeric comparison for >, <, >=, <=.
     */
    private boolean evaluate(String left, String operator, String right) throws Exception {
        if (left == null)
            left = "";
        if (right == null)
            right = "";

        switch (operator) {
            case "==":
                return left.equals(right);
            case "!=":
                return !left.equals(right);
            case ">":
                return compareNumeric(left, right) > 0;
            case "<":
                return compareNumeric(left, right) < 0;
            case ">=":
                return compareNumeric(left, right) >= 0;
            case "<=":
                return compareNumeric(left, right) <= 0;
            case "contains":
                return left.contains(right);
            default:
                throw new Exception("Unsupported operator: " + operator);
        }
    }

    /**
     * Compares two strings as numbers. Falls back to string comparison.
     */
    private int compareNumeric(String left, String right) {
        try {
            double l = Double.parseDouble(left);
            double r = Double.parseDouble(right);
            return Double.compare(l, r);
        } catch (NumberFormatException e) {
            return left.compareTo(right);
        }
    }

    /**
     * Parses legacy condition format: "context.var == value" or "var != value"
     */
    private boolean parseLegacyCondition(String condition, ExecutionContext context) throws Exception {
        // Detect operator
        String[] operators = { "!=", ">=", "<=", "==", ">", "<", "contains" };
        String detectedOp = null;
        int opIndex = -1;

        for (String op : operators) {
            int idx = condition.indexOf(op);
            if (idx >= 0) {
                detectedOp = op;
                opIndex = idx;
                break;
            }
        }

        if (detectedOp == null) {
            throw new Exception("Cannot parse condition: " + condition);
        }

        String leftExpr = condition.substring(0, opIndex).trim();
        String rightExpr = condition.substring(opIndex + detectedOp.length()).trim();

        String leftValue = resolveOperand(leftExpr, context);
        String rightValue = resolveOperand(rightExpr, context);

        return evaluate(leftValue, detectedOp, rightValue);
    }
}
