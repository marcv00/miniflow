package com.miniflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.miniflow.model.Workflow;
import com.miniflow.core.WorkflowRunner;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        ObjectMapper mapper = new ObjectMapper();
        Scanner scanner = new Scanner(System.in);

        try {
            if (scanner.hasNextLine()) {
                String jsonInput = scanner.nextLine();
                // Map the JSON to our Java Workflow Object
                Workflow workflow = mapper.readValue(jsonInput, Workflow.class);
                
                // Run the engine
                new WorkflowRunner().run(workflow);
                
                System.out.println("{\"status\": \"FINISHED\"}");
            }
        } catch (Exception e) {
            System.err.println("CRITICAL_ERROR: " + e.getMessage());
        }
    }
}