package com.miniflow.factory;
import com.miniflow.strategies.*;

public class ExecutorFactory {
    public static NodeExecutor getExecutor(String type) {
        return switch (type) {
            case "START" -> (node, ctx) -> System.out.println("Workflow Started...");
            case "CREATE_FOLDER" -> new CreateFolderStrategy(); // The one we tested
            // case "HTTP_REQUEST" -> new HttpStrategy();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}