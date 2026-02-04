package com.miniflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.miniflow.model.Workflow;
import com.miniflow.core.WorkflowRunner;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        Scanner scanner = new Scanner(System.in);

        try {
            StringBuilder sb = new StringBuilder();
            while (scanner.hasNextLine()) sb.append(scanner.nextLine());
            String jsonInput = sb.toString();
            if (!jsonInput.isBlank()) {
                Workflow workflow = mapper.readValue(jsonInput, Workflow.class);
                new WorkflowRunner().run(workflow);
                
                System.out.println("{\"status\": \"FINISHED\"}");
            }
        } catch (Exception e) {
            System.err.println("CRITICAL_ERROR: " + e.getMessage());
        }
    }
}