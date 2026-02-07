package com.miniflow.context;

import java.util.HashMap;
import java.util.Map;

public class ExecutionContext {
    private static ExecutionContext instance;
    private final Map<String, Object> variables = new HashMap<>();

    private ExecutionContext() {}

    public static ExecutionContext getInstance() {
        if (instance == null) instance = new ExecutionContext();
        return instance;
    }

    public void setVariable(String key, Object value) {
        variables.put(key, value);
    }

    public Object getVariable(String key) {
        return variables.get(key);
    }

    public void clear() {
        variables.clear();
    }
}
