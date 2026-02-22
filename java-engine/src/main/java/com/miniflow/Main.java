package com.miniflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.miniflow.model.Node;
import com.miniflow.model.Workflow;
import com.miniflow.core.WorkflowRunner;

import java.util.Map;
import java.util.Scanner;

/**
 * Entry point for the MiniFlow execution engine.
 * 
 * Modes:
 * - Default: Reads workflow JSON from stdin, executes full workflow.
 * - --test-node: Reads single node JSON from stdin, executes that node only.
 */
public class Main {
    public static void main(String[] args) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        boolean testNodeMode = args.length > 0 && "--test-node".equals(args[0]);

        try {
            String jsonInput = readStdin();
            if (jsonInput.isBlank()) {
                System.err.println("No input received.");
                System.exit(1);
                return;
            }

            WorkflowRunner runner = new WorkflowRunner();

            if (testNodeMode) {
                // ── Test single node mode ──
                Node node = mapper.readValue(jsonInput, Node.class);
                Map<String, Object> result = runner.testSingleNode(node);
                System.out.println(mapper.writeValueAsString(result));
            } else {
                // ── Full workflow execution mode ──
                Workflow workflow = mapper.readValue(jsonInput, Workflow.class);
                runner.run(workflow);
                // Run JSON is already printed to stdout by WorkflowRunner
            }
        } catch (Exception e) {
            System.err.println("CRITICAL_ERROR: " + e.getMessage());
            System.exit(1);
        }
    }

    private static String readStdin() {
        Scanner scanner = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();
        while (scanner.hasNextLine()) {
            sb.append(scanner.nextLine());
        }
        return sb.toString();
    }
}