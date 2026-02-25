package com.miniflow.factory;

import static org.junit.jupiter.api.Assertions.*;

import com.miniflow.strategies.LoggingNodeDecorator;
import com.miniflow.strategies.NodeExecutor;
import org.junit.jupiter.api.Test;

class ExecutorFactoryTest {

    @Test
    void returnsDecoratedAndCachedExecutors() {
        NodeExecutor a = ExecutorFactory.getExecutor("start");
        NodeExecutor b = ExecutorFactory.getExecutor(" START ");

        assertInstanceOf(LoggingNodeDecorator.class, a);
        assertSame(a, b);
    }

    @Test
    void throwsForUnknownType() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> ExecutorFactory.getExecutor("not_existing")
        );
        assertTrue(ex.getMessage().contains("Unknown node type"));
    }
}
