package com.miniflow.factory;
import com.miniflow.strategies.*;

public class ExecutorFactory {
    public static NodeExecutor getExecutor(String type) {
        String t = type == null ? "" : type.toUpperCase();

        return switch (t) {
            case "START" -> new StartStrategy();
            case "CREATE_FOLDER" -> new CreateFolderStrategy();
            case "HTTP_REQUEST" -> new HttpRequestStrategy();
            case "COMMAND" -> new CommandStrategy();
            case "CONDITIONAL" -> new ConditionalStrategy();
            case "END" -> new EndStrategy();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}