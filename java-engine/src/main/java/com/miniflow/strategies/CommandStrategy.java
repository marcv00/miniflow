package com.miniflow.strategies;

import com.miniflow.context.ExecutionContext;
import com.miniflow.model.Node;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CommandStrategy implements NodeExecutor {
    private static final Pattern TEMPLATE_PATTERN = Pattern.compile("\\{\\{\\s*(?:context\\.)?([a-zA-Z0-9_]+)\\s*\\}\\}");

    @Override
    public void execute(Node node, ExecutionContext context) throws Exception {
        Map<String, Object> config = extractConfig(node);

        String command = renderTemplate(asString(config.get("command")), context);
        String scriptPath = renderTemplate(asString(config.get("scriptPath")), context);
        String args = renderTemplate(asString(config.get("args")), context);
        String outputKey = asString(config.get("outputKey"));

        if (command == null || command.isBlank()) throw new Exception("Missing command in node config");

        boolean pythonCommand = isPythonCommand(command);
        if (pythonCommand) {
            if (scriptPath == null || scriptPath.isBlank()) {
                throw new Exception("Para comando python, la ruta del script local es obligatoria");
            }
            Path script = Paths.get(unquote(scriptPath.trim()));
            if (!Files.exists(script) || !Files.isRegularFile(script)) {
                throw new Exception("No se encontró el script en la ruta indicada: " + scriptPath);
            }
        }

        args = buildArgs(command, scriptPath, args, context);

        String full = (args == null || args.isBlank()) ? command : command + " " + args;

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

        if (exit != 0) throw new Exception("Command failed with exit code " + exit);
    }

    private String buildArgs(String command, String scriptPath, String args, ExecutionContext context) {
        String a = args == null ? "" : args.trim();
        boolean pythonCommand = isPythonCommand(command);

        if (pythonCommand && scriptPath != null && !scriptPath.isBlank()) {
            String quotedPath = quote(scriptPath.trim());
            if (a.isBlank()) {
                a = quotedPath;
            } else if (!containsScriptPath(a, scriptPath)) {
                a = quotedPath + " " + a;
            }
        }

        return maybeAppendPayloadArg(pythonCommand, a, context);
    }

    private boolean containsScriptPath(String args, String scriptPath) {
        if (args == null || scriptPath == null) return false;
        String normalizedArgs = args.replace("\\", "/").toLowerCase();
        String normalizedPath = scriptPath.replace("\\", "/").toLowerCase();
        return normalizedArgs.contains(normalizedPath);
    }

    private String maybeAppendPayloadArg(boolean pythonCommand, String args, ExecutionContext context) {
        if (!pythonCommand) return args;

        String a = args == null ? "" : args.trim();
        boolean hasTemplate = a.contains("{{") && a.contains("}}");

        Object payloadObj = context.getVariable("payload");
        String payload = payloadObj == null ? null : String.valueOf(payloadObj);

        if (!hasTemplate && payload != null && !payload.isBlank()) {
            String escaped = payload.replace("\"", "\\\"");
            if (a.isBlank()) return quote(escaped);
            return a + " " + quote(escaped);
        }

        return a;
    }


    private boolean isPythonCommand(String command) {
        if (command == null) return false;
        String c = command.trim().toLowerCase();
        return c.equals("python") || c.startsWith("python ") || c.equals("python3") || c.startsWith("python3 ");
    }

    private String unquote(String value) {
        if (value == null) return null;
        String v = value.trim();
        if (v.length() >= 2 && v.startsWith("\"") && v.endsWith("\"")) {
            return v.substring(1, v.length() - 1);
        }
        return v;
    }

    private String quote(String value) {
        if (value == null) return "\"\"";
        String v = value.trim();
        if (v.startsWith("\"") && v.endsWith("\"")) return v;
        return "\"" + v.replace("\"", "\\\"") + "\"";
    }

    private String renderTemplate(String input, ExecutionContext context) {
        if (input == null || input.isBlank()) return input;

        Matcher matcher = TEMPLATE_PATTERN.matcher(input);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String key = matcher.group(1);
            Object value = context.getVariable(key);
            String replacement = value == null ? "" : String.valueOf(value);
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }

        matcher.appendTail(sb);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
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
