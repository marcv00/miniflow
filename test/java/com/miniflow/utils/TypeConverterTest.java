package com.miniflow.utils;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class TypeConverterTest {

    @Test
    void asStringConvertsAnyObject() {
        assertNull(TypeConverter.asString(null));
        assertEquals("123", TypeConverter.asString(123));
        assertEquals("true", TypeConverter.asString(true));
    }

    @Test
    void asIntSupportsNumbersStringsAndFallback() {
        assertEquals(7, TypeConverter.asInt(7.9, 0));
        assertEquals(15, TypeConverter.asInt(" 15 ", 0));
        assertEquals(9, TypeConverter.asInt("bad", 9));
        assertEquals(3, TypeConverter.asInt(null, 3));
    }

    @Test
    void normalizeDetectsNumericStrings() {
        assertEquals(10, TypeConverter.normalize("10"));
        assertEquals(-3, TypeConverter.normalize("-3"));
        assertEquals(2.5d, TypeConverter.normalize("2.5"));
        assertEquals("abc", TypeConverter.normalize("abc"));
        assertEquals(99L, TypeConverter.normalize(99L));
    }
}
