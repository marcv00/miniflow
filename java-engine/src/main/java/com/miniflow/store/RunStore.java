package com.miniflow.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.miniflow.model.Run;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Persists Run objects as JSON files in a configurable directory.
 * 
 * RF-B15: List runs by workflow.
 * RF-B16: Query full run detail.
 * RF-B17: Query logs per run/node.
 * RNF-B01: Preserve history on failures.
 * RNF-B04: Store execution data in JSON files.
 */
public class RunStore {

    private final File runsDir;
    private final ObjectMapper mapper;

    public RunStore() {
        String dir = System.getProperty("miniflow.runsDir",
                System.getProperty("user.home") + File.separator + ".miniflow" + File.separator + "runs");
        this.runsDir = new File(dir);
        this.runsDir.mkdirs();

        this.mapper = new ObjectMapper();
        this.mapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    public RunStore(String directory) {
        this.runsDir = new File(directory);
        this.runsDir.mkdirs();

        this.mapper = new ObjectMapper();
        this.mapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    /**
     * Saves a Run to disk as {runId}.json
     */
    public void save(Run run) throws IOException {
        File file = new File(runsDir, run.runId + ".json");
        mapper.writeValue(file, run);
    }

    /**
     * Lists all runs, optionally filtered by workflow name.
     * Returns summaries sorted by startedAt descending (most recent first).
     */
    public List<Run> list(String workflowName) throws IOException {
        List<Run> runs = new ArrayList<>();
        File[] files = runsDir.listFiles((d, name) -> name.endsWith(".json"));
        if (files == null)
            return runs;

        for (File file : files) {
            try {
                Run run = mapper.readValue(file, Run.class);
                if (workflowName == null || workflowName.equals(run.workflowName)) {
                    runs.add(run);
                }
            } catch (Exception e) {
                // Skip corrupt files
            }
        }

        runs.sort(Comparator.comparing((Run r) -> r.startedAt != null ? r.startedAt : "")
                .reversed());
        return runs;
    }

    /**
     * Gets a single run by its ID.
     */
    public Run get(String runId) throws IOException {
        File file = new File(runsDir, runId + ".json");
        if (!file.exists())
            return null;
        return mapper.readValue(file, Run.class);
    }
}
