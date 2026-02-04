package com.miniflow.strategies;

import com.miniflow.model.Node;
import com.miniflow.context.ExecutionContext;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class CommandStrategy implements NodeExecutor {
    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String command = asString(config.get("command"));
        String args = asString(config.get("args"));
        String outputKey = asString(config.get("outputKey"));

        if (command == null || command.isBlank()) throw new Exception("Missing command in node config");

        String full = args == null || args.isBlank() ? command : command + " " + args;

        boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
        List<String> cmd = new ArrayList<>();
        if (isWindows) {
            cmd.add("cmd");
            cmd.add("/c");
            cmd.add(full);
        } else {
            cmd.add("bash");
            cmd.add("-lc");
            cmd.add(full);
        }

        Process process = new ProcessBuilder(cmd).redirectErrorStream(false).start();

        String stdout = readAll(process.getInputStream());
        String stderr = readAll(process.getErrorStream());
        int exit = process.waitFor();

        context.setVariable("lastStdout", stdout);
        context.setVariable("lastStderr", stderr);
        context.setVariable("lastExitCode", exit);

        if (outputKey != null && !outputKey.isBlank()) context.setVariable(outputKey, stdout);

        if (exit != 0) throw new Exception("Command failed with exit code " + exit + (stderr.isBlank() ? "" : ": " + stderr.trim()));

        System.out.println("SUCCESS: Node " + node.id + " executed command");
    }

    private Map<String, Object> extractConfig(Node node) {
        if (node.data == null) return Map.of();
        Object nested = node.data.get("config");
        if (nested instanceof Map<?, ?> m) return (Map<String, Object>) m;
        return node.data;
    }

    private String asString(Object v) {
        if (v == null) return null;
        return String.valueOf(v);
    }

    private String readAll(java.io.InputStream in) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }
}
