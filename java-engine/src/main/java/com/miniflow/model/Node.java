package com.miniflow.model;
import java.util.Map;

public class Node {
    public String id;
    public String type;
    public Map<String, Object> data; // Config from React
    public String errorPolicy; // STOP_ON_FAIL or CONTINUE_ON_FAIL

    public Map<String, Object> position;
    public Integer width;
    public Integer height;
}