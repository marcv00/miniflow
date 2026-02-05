package com.miniflow.strategies;

import com.miniflow.model.Node;
import com.miniflow.context.ExecutionContext;
import java.io.File;
import java.nio.file.Paths;
import java.util.Map;

public class CreateFolderStrategy implements NodeExecutor {
    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);
        
        String name = (String) config.get("folderName");
        String path = (String) config.get("folderPath");

        if (name == null || path == null) throw new Exception("Missing folderName or folderPath in node config");

        File dir = Paths.get(path, name).toFile();
        
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (!created) throw new Exception("Could not create folder: " + dir.getAbsolutePath());
        }

        context.setVariable("lastCreatedFolder", dir.getAbsolutePath());
        }

    private Map<String, Object> extractConfig(Node node) {
        if (node.data == null) return Map.of();
        Object nested = node.data.get("config");
        if (nested instanceof Map<?, ?> m) return (Map<String, Object>) m;
        return node.data;
    }
}