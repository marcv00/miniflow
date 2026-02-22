package com.miniflow.strategies;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Executes OS commands and scripts with timeout support.
 *
 * RF-B08: Execute COMMAND nodes.
 * RF-B13: Support timeout.
 */
public class CommandStrategy extends AbstractNodeExecutor {

    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String command = asString(config.get("command"));
        String scriptPath = asString(config.get("scriptPath"));
        String args = asString(config.get("args"));
        String cwd = asString(config.get("cwd"));
        String envVarsStr = asString(config.get("envVars"));
        String captureOutput = asString(config.get("captureOutput"));
        String outputKey = asString(config.get("outputKey"));
        long timeoutMs = asLong(config.getOrDefault("timeoutMs", 30000), 30000);

        if (command == null || command.isBlank())
            throw new Exception("Missing command in COMMAND node");

        // Resolve template variables
        if (args != null)
            args = resolveTemplate(args, context);
        if (scriptPath != null)
            scriptPath = resolveTemplate(scriptPath, context);

        // Build command list
        List<String> cmdList = buildCommandList(command, scriptPath, args);

        ProcessBuilder pb = new ProcessBuilder(cmdList);
        pb.redirectErrorStream(false);

        // Set working directory
        if (cwd != null && !cwd.isBlank()) {
            pb.directory(new java.io.File(cwd));
        }

        // Set environment variables
        applyEnvVars(pb, envVarsStr);

        // Execute
        Process process = pb.start();

        // Read stdout and stderr concurrently
        StringBuilder stdoutSb = new StringBuilder();
        StringBuilder stderrSb = new StringBuilder();

        Thread stdoutThread = new Thread(() -> {
            try (BufferedReader r = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = r.readLine()) != null)
                    stdoutSb.append(line).append("\n");
            } catch (Exception ignored) {
            }
        });

        Thread stderrThread = new Thread(() -> {
            try (BufferedReader r = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = r.readLine()) != null)
                    stderrSb.append(line).append("\n");
            } catch (Exception ignored) {
            }
        });

        stdoutThread.start();
        stderrThread.start();

        // RF-B13: Timeout support
        boolean finished = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new Exception("TIMEOUT after " + timeoutMs + "ms");
        }

        stdoutThread.join(1000);
        stderrThread.join(1000);

        String stdout = stdoutSb.toString().trim();
        String stderr = stderrSb.toString().trim();
        int exitCode = process.exitValue();

        // Store results in context
        context.setVariable("lastStdout", stdout);
        context.setVariable("lastStderr", stderr);
        context.setVariable("lastExitCode", exitCode);

        // Store in named output key if configured
        if (outputKey != null && !outputKey.isBlank()) {
            if ("stderr".equalsIgnoreCase(captureOutput)) {
                context.setVariable(outputKey, stderr);
            } else {
                context.setVariable(outputKey, stdout);
            }
        }

        if (exitCode != 0) {
            throw new Exception("Command exited with code " + exitCode
                    + (stderr.isBlank() ? "" : ": " + stderr));
        }
    }

    // ─── Helpers ────────────────────────────────────

    private List<String> buildCommandList(String command, String scriptPath, String args) {
        List<String> cmdList = new ArrayList<>();

        boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");

        if ("python".equalsIgnoreCase(command) || "python3".equalsIgnoreCase(command)) {
            cmdList.add(isWindows ? "python" : "python3");
            if (scriptPath != null && !scriptPath.isBlank())
                cmdList.add(scriptPath);
        } else if ("node".equalsIgnoreCase(command)) {
            cmdList.add("node");
            if (scriptPath != null && !scriptPath.isBlank())
                cmdList.add(scriptPath);
        } else {
            if (isWindows) {
                cmdList.add("cmd.exe");
                cmdList.add("/c");
            } else {
                cmdList.add("sh");
                cmdList.add("-c");
            }
            StringBuilder fullCmd = new StringBuilder(command);
            if (scriptPath != null && !scriptPath.isBlank()) {
                fullCmd.append(" ").append(scriptPath);
            }
            if (args != null && !args.isBlank()) {
                fullCmd.append(" ").append(args);
            }
            cmdList.add(fullCmd.toString());
            return cmdList;
        }

        // Append args for python/node
        if (args != null && !args.isBlank()) {
            for (String arg : splitArgs(args)) {
                cmdList.add(arg);
            }
        }

        return cmdList;
    }

    private List<String> splitArgs(String args) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuote = false;
        char quoteChar = '"';

        for (char c : args.toCharArray()) {
            if ((c == '"' || c == '\'') && !inQuote) {
                inQuote = true;
                quoteChar = c;
            } else if (c == quoteChar && inQuote) {
                inQuote = false;
            } else if (c == ' ' && !inQuote) {
                if (current.length() > 0) {
                    result.add(current.toString());
                    current.setLength(0);
                }
            } else {
                current.append(c);
            }
        }
        if (current.length() > 0)
            result.add(current.toString());
        return result;
    }

    @SuppressWarnings("unchecked")
    private void applyEnvVars(ProcessBuilder pb, String envVarsStr) {
        if (envVarsStr == null || envVarsStr.isBlank())
            return;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Object parsed = mapper.readValue(envVarsStr, Object.class);
            if (parsed instanceof Map<?, ?> map) {
                for (Map.Entry<?, ?> e : map.entrySet()) {
                    pb.environment().put(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
                }
            }
        } catch (Exception ignored) {
        }
    }
}
