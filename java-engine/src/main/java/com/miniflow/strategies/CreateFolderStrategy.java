package com.miniflow.strategies;

import com.miniflow.model.Node;
import com.miniflow.context.ExecutionContext;

import java.io.File;
import java.nio.file.Paths;
import java.util.Map;

public class CreateFolderStrategy extends AbstractNodeExecutor {
    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String name = asString(config.get("folderName"));
        String path = asString(config.get("folderPath"));

        if (name == null || path == null)
            throw new Exception("Missing folderName or folderPath in node config");

        File dir = Paths.get(path, name).toFile();

        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (!created)
                throw new Exception("Could not create folder: " + dir.getAbsolutePath());
        }

        context.setVariable("lastCreatedFolder", dir.getAbsolutePath());
    }
}