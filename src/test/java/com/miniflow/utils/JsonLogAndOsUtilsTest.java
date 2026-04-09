package com.miniflow.utils;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class JsonLogAndOsUtilsTest {

    @Test
    void jsonUtilsParsesAndExtractsPathValues() {
        Object parsed = JsonUtils.tryParse("{\"status\":200,\"data\":{\"name\":\"Ana\"}}");
        assertNotNull(parsed);
        assertEquals(200, JsonUtils.extractByPath(parsed, "$.status"));
        assertEquals("Ana", JsonUtils.extractByPath(parsed, "data.name"));
        assertNull(JsonUtils.extractByPath(parsed, "$.data.missing"));
    }

    @Test
    void jsonUtilsReturnsNullForInvalidInputs() {
        assertNull(JsonUtils.tryParse(null));
        assertNull(JsonUtils.tryParse(" "));
        assertNull(JsonUtils.tryParse("{broken"));
        assertNull(JsonUtils.extractByPath(null, "$.a"));
        assertNull(JsonUtils.extractByPath(Map.of("a", 1), ""));
    }

    @Test
    void logUtilsFormatsMapsAndHandlesFailures() {
        String empty = LogUtils.formatMapForLog(null);
        assertEquals("{}", empty);

        String longText = "x".repeat(6000);
        String formatted = LogUtils.formatMapForLog(Map.of("text", longText));
        assertTrue(formatted.contains("[TRUNCATED]"));

        Map<String, Object> cyclic = new HashMap<>();
        cyclic.put("self", cyclic);
        String fallback = LogUtils.formatMapForLog(cyclic);
        assertTrue(fallback.contains("Could not serialize map"));
    }

    @Test
    void osUtilsQuotesAndReadsStream() throws Exception {
        assertEquals("\"\"", OSUtils.quote(null));
        assertEquals("\"hello world\"", OSUtils.quote(" hello world "));
        assertEquals("\"already\"", OSUtils.quote("\"already\""));
        assertEquals("\"a\\\"b\"", OSUtils.quote("a\"b"));

        byte[] bytes = "line1\nline2".getBytes(StandardCharsets.UTF_8);
        String read = OSUtils.readStream(new ByteArrayInputStream(bytes));
        assertEquals("line1\nline2\n", read);
    }

    @Test
    void osUtilsDetectsCurrentPlatform() {
        boolean expected = System.getProperty("os.name").toLowerCase().contains("win");
        assertEquals(expected, OSUtils.isWindows());
    }
}
