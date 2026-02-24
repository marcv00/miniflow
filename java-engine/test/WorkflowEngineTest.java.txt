package com.miniflow.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

public class WorkflowEngineTest {

    @Mock
    private WorkflowRepository workflowRepository;

    private WorkflowEngine workflowEngine;

    @BeforeEach
    void setUp() {

        MockitoAnnotations.openMocks(this);

        workflowEngine = new WorkflowEngine(workflowRepository);

    }

    @Test
    void testExecuteWorkflowCorrectamente() {

        // ARRANGE

        Workflow mockWorkflow = new Workflow("TEST");

        when(workflowRepository.findById("1"))
                .thenReturn(mockWorkflow);

        // ACT

        String resultado = workflowEngine.executeWorkflow("1");

        // ASSERT

        assertEquals("TEST", resultado);

        verify(workflowRepository).findById("1");

    }

}