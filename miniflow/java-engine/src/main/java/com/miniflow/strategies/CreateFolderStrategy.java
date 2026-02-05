package com.miniflow.strategies;

import com.miniflow.model.Node;
import com.miniflow.context.ExecutionContext;
import java.io.File;
import java.nio.file.Paths;
import java.util.Map;

public class CreateFolderStrategy implements NodeExecutor {
    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        // In the full engine, React sends data inside the "data" map
        Map<String, Object> config = node.data;
        
        String name = (String) config.get("folderName");
        String path = (String) config.get("folderPath");

        if (name == null || path == null) {
            throw new Exception("Missing folderName or folderPath in node config");
        }

        File dir = Paths.get(path, name).toFile();
        
        if (dir.mkdirs()) {
            System.out.println("SUCCESS: Node " + node.id + " created folder at " + dir.getAbsolutePath());
        } else {
            System.out.println("INFO: Node " + node.id + " - Folder already exists or could not be created.");
        }
    }
}