import { describe, it, expect, beforeEach, vi } from "vitest"
import { loadAll, saveAll } from "../LocalStorage"

describe("LocalStorage module (unit tests with mocks)", () => {
  const STORAGE_KEY = "miniflow_builder_workflow2"

  const backing: Record<string, string> = {}

  beforeEach(() => {
    // limpiar almacenamiento fake
    for (const k of Object.keys(backing)) delete backing[k]

    // mock global localStorage
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => (key in backing ? backing[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        backing[key] = value
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as any)
  })

  it("loadAll returns [] when key does not exist", () => {
    // Arrange (no data in backing)

    // Act
    const result = loadAll()

    // Assert
    expect(result).toEqual([])
    expect(localStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY)
  })

  it("loadAll returns [] when JSON is invalid", () => {
    // Arrange
    backing[STORAGE_KEY] = "{invalid-json"

    // Act
    const result = loadAll()

    // Assert
    expect(result).toEqual([])
  })

  it("loadAll returns [] when JSON is valid but not an array", () => {
    // Arrange
    backing[STORAGE_KEY] = JSON.stringify({ a: 1 })

    // Act
    const result = loadAll()

    // Assert
    expect(result).toEqual([])
  })

  it("saveAll stores stringified array under correct key", () => {
    // Arrange
    const workflows = [{ id: "1" }, { id: "2" }] as any

    // Act
    saveAll(workflows)

    // Assert
    expect(localStorage.setItem).toHaveBeenCalledTimes(1)

    const [key, value] = (localStorage.setItem as any).mock.calls[0]
    expect(key).toBe(STORAGE_KEY)
    expect(value).toBe(JSON.stringify(workflows))
  })
})