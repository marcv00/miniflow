package com.miniflow.utils;

import static org.junit.jupiter.api.Assertions.*;

import com.miniflow.context.ExecutionContext;
import org.junit.jupiter.api.Test;

class TemplateAndExpressionTest {

    @Test
    void templateEngineRendersContextVariables() {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("name", "Jean");
        context.setVariable("status", 200);

        String rendered = TemplateEngine.render(
                "Hola {{name}} / {{ context.status }} / {{context.missing}}",
                context
        );

        assertEquals("Hola Jean / 200 / ", rendered);
    }

    @Test
    void templateEngineReturnsInputForBlankOrNull() {
        ExecutionContext context = new ExecutionContext();
        assertNull(TemplateEngine.render(null, context));
        assertEquals("   ", TemplateEngine.render("   ", context));
    }

    @Test
    void expressionEvaluatorSupportsEqualityAndInequality() {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("status", 200);
        context.setVariable("env", "prod");

        assertTrue(ExpressionEvaluator.evaluate("context.status == 200", context));
        assertTrue(ExpressionEvaluator.evaluate("env != dev", context));
        assertFalse(ExpressionEvaluator.evaluate("status != 200", context));
    }

    @Test
    void expressionEvaluatorRejectsInvalidExpressions() {
        ExecutionContext context = new ExecutionContext();
        context.setVariable("x", 1);

        assertFalse(ExpressionEvaluator.evaluate(null, context));
        assertFalse(ExpressionEvaluator.evaluate("   ", context));
        assertFalse(ExpressionEvaluator.evaluate("x > 0", context));
    }
}
