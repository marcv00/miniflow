import { describe, it, expect } from "vitest"
import { validate } from "../WorkflowValidator"

// Helpers (Arrange)
type N = { id: string; type: string; data?: any }
type E = { id: string; source: string; target: string; label?: string; sourceHandle?: string }

const n = (id: string, type: string, config: any = {}, label?: string): N => ({
  id,
  type,
  data: { label, config },
})

const e = (source: string, target: string, label?: string, sourceHandle?: string): E => ({
  id: `${source}->${target}`,
  source,
  target,
  label,
  sourceHandle,
})

const hasMsg = (issues: any[], includes: string) =>
  issues.some(i => typeof i.message === "string" && i.message.includes(includes))

describe("WorkflowValidator.validate", () => {
  // ---------- START / END rules ----------

  it("fails when there is no START node", () => {
    // Arrange
    const nodes = [n("end", "end")]
    const edges: E[] = []

    // Act
    const res = validate(nodes as any, edges as any)

    // Assert
    expect(res.isValid).toBe(false)
    expect(hasMsg(res.issues as any, "exactamente 1 nodo START")).toBe(true)
  })

  it("fails when there are 2 START nodes (duplicate START)", () => {
    const nodes = [n("s1", "start"), n("s2", "start"), n("end", "end")]
    const res = validate(nodes as any, [] as any)

    expect(res.isValid).toBe(false)
    // El mensaje de duplicado se agrega para el segundo START en adelante
    expect(res.issues.some((i: any) => i.nodeId === "s2" && i.severity === "error")).toBe(true)
  })

  it("fails when there is no END node", () => {
    const nodes = [n("s", "start"), n("c", "command", { command: "ls" })]
    const edges = [e("s", "c")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(hasMsg(res.issues as any, "exactamente 1 nodo END")).toBe(true)
  })

  it("fails when END has outgoing edges", () => {
    const nodes = [n("s", "start"), n("end", "end"), n("c", "command", { command: "ls" })]
    const edges = [e("s", "end"), e("end", "c")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(res.issues.some((i: any) => i.nodeId === "end" && i.message.includes("END no debe tener salidas"))).toBe(true)
  })

  // ---------- Graph structure ----------

  it("fails when there is a cycle in the workflow", () => {
    const nodes = [n("s", "start"), n("a", "command", { command: "ls" }), n("end", "end")]
    const edges = [e("s", "a"), e("a", "s"), e("a", "end")] // cycle a->s->a

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(hasMsg(res.issues as any, "No se permiten ciclos")).toBe(true)
  })

  it("warns about a node that is not reachable from START", () => {
    const nodes = [
      n("s", "start"),
      n("end", "end"),
      n("x", "command", { command: "ls" }, "NodoX"), // unreachable
    ]
    const edges = [e("s", "end")]

    const res = validate(nodes as any, edges as any)

    expect(res.issues.some((i: any) => i.nodeId === "x" && i.severity === "warning")).toBe(true)
    expect(res.issues.some((i: any) => i.message.includes("no es alcanzable desde START"))).toBe(true)
  })

  it("warns about a node that cannot reach END", () => {
    const nodes = [n("s", "start"), n("a", "command", { command: "ls" }), n("end", "end")]
    const edges = [e("s", "a")] // a never reaches end

    const res = validate(nodes as any, edges as any)

    expect(res.issues.some((i: any) => i.nodeId === "a" && i.severity === "warning")).toBe(true)
    expect(res.issues.some((i: any) => i.message.includes("no llega al nodo END"))).toBe(true)
  })

  it('fails when there is a terminal node that is not END (no outgoing edges)', () => {
    const nodes = [
      n("s", "start"),
      n("a", "command", { command: "ls" }),
      n("end", "end"),
    ]
    // a is terminal because it has no outgoing edges; end exists but is not reached
    const edges = [e("s", "a")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(res.issues.some((i: any) => i.nodeId === "a" && i.severity === "error" && i.message.includes("Solo END puede ser un nodo terminal"))).toBe(true)
  })

  // ---------- Minimum config per type ----------

  it('fails when HTTP_REQUEST has no url', () => {
    const nodes = [
      n("s", "start"),
      n("h", "http_request", { method: "GET" }),
      n("end", "end"),
    ]
    const edges = [e("s", "h"), e("h", "end")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(res.issues.some((i: any) => i.nodeId === "h" && i.message.includes('sin URL'))).toBe(true)
  })

  it('fails when HTTP_REQUEST has timeoutMs <= 0 (boundary)', () => {
    const nodes = [
      n("s", "start"),
      n("h", "http_request", { url: "http://x", method: "GET", timeoutMs: 0 }),
      n("end", "end"),
    ]
    const edges = [e("s", "h"), e("h", "end")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(res.issues.some((i: any) => i.nodeId === "h" && i.message.includes("timeout inválido"))).toBe(true)
  })

  it('fails when CONDITIONAL does not have exactly TRUE and FALSE outputs', () => {
    const nodes = [
      n("s", "start"),
      n("cnd", "conditional", { condition: "x>1" }),
      n("t", "command", { command: "ls" }),
      n("end", "end"),
    ]
    // Only TRUE branch -> invalid
    const edges = [e("s", "cnd"), e("cnd", "t", "TRUE"), e("t", "end")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(res.issues.some((i: any) => i.nodeId === "cnd" && i.message.includes("exactamente 2 salidas"))).toBe(true)
  })

  it('fails when COMMAND is python but scriptPath is missing', () => {
    const nodes = [
      n("s", "start"),
      n("cmd", "command", { command: "python" }),
      n("end", "end"),
    ]
    const edges = [e("s", "cmd"), e("cmd", "end")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(false)
    expect(res.issues.some((i: any) => i.nodeId === "cmd" && i.message.includes('python requiere'))).toBe(true)
  })

  // ---------- Positive control ----------

  it("passes for a simple valid workflow START -> COMMAND -> END", () => {
    const nodes = [n("s", "start"), n("cmd", "command", { command: "ls" }), n("end", "end")]
    const edges = [e("s", "cmd"), e("cmd", "end")]

    const res = validate(nodes as any, edges as any)

    expect(res.isValid).toBe(true)
    expect(res.issues.filter((i: any) => i.severity === "error").length).toBe(0)
  })

  it('fails when HTTP_REQUEST has no method', () => {
  // Arrange
  const nodes = [
    n("s", "start"),
    n("h", "http_request", { url: "http://x" }), // method missing
    n("end", "end"),
  ]
  const edges = [e("s", "h"), e("h", "end")]

  // Act
  const res = validate(nodes as any, edges as any)

  // Assert
  expect(res.isValid).toBe(false)
  expect(res.issues.some((i: any) => i.nodeId === "h" && i.message.includes("sin método"))).toBe(true)
    })

    it('fails when HTTP_REQUEST has retries < 0 (boundary)', () => {
  // Arrange
  const nodes = [
    n("s", "start"),
    n("h", "http_request", { url: "http://x", method: "GET", retries: -1 }), // invalid
    n("end", "end"),
  ]
  const edges = [e("s", "h"), e("h", "end")]

  // Act
  const res = validate(nodes as any, edges as any)

  // Assert
  expect(res.isValid).toBe(false)
  expect(res.issues.some((i: any) => i.nodeId === "h" && i.message.includes("retries inválido"))).toBe(true)
    })

    it('fails when CONDITIONAL has no condition (neither legacy nor structured)', () => {
  // Arrange
  const nodes = [
    n("s", "start"),
    n("cnd", "conditional", {}), // no condition fields
    n("t", "command", { command: "ls" }),
    n("f", "command", { command: "pwd" }),
    n("end", "end"),
  ]
  const edges = [
    e("s", "cnd"),
    e("cnd", "t", "TRUE"),
    e("cnd", "f", "FALSE"),
    e("t", "end"),
    e("f", "end"),
  ]

  // Act
  const res = validate(nodes as any, edges as any)

  // Assert
  expect(res.isValid).toBe(false)
  expect(res.issues.some((i: any) => i.nodeId === "cnd" && i.message.includes('sin condición'))).toBe(true)
    })

    it('fails when HTTP_REQUEST has no method', () => {
  // Arrange
  const nodes = [
    n("s", "start"),
    n("h", "http_request", { url: "http://x" }), // method missing
    n("end", "end"),
  ]
  const edges = [e("s", "h"), e("h", "end")]

  // Act
  const res = validate(nodes as any, edges as any)

  // Assert
  expect(res.isValid).toBe(false)
  expect(res.issues.some((i: any) => i.nodeId === "h" && i.message.includes("sin método"))).toBe(true)
})

it('fails when HTTP_REQUEST has retries < 0 (boundary)', () => {
  // Arrange
  const nodes = [
    n("s", "start"),
    n("h", "http_request", { url: "http://x", method: "GET", retries: -1 }), // invalid
    n("end", "end"),
  ]
  const edges = [e("s", "h"), e("h", "end")]

  // Act
  const res = validate(nodes as any, edges as any)

  // Assert
  expect(res.isValid).toBe(false)
  expect(res.issues.some((i: any) => i.nodeId === "h" && i.message.includes("retries inválido"))).toBe(true)
})

it('fails when CONDITIONAL has no condition (neither legacy nor structured)', () => {
  // Arrange
  const nodes = [
    n("s", "start"),
    n("cnd", "conditional", {}), // no condition fields
    n("t", "command", { command: "ls" }),
    n("f", "command", { command: "pwd" }),
    n("end", "end"),
  ]
  const edges = [
    e("s", "cnd"),
    e("cnd", "t", "TRUE"),
    e("cnd", "f", "FALSE"),
    e("t", "end"),
    e("f", "end"),
  ]

  // Act
  const res = validate(nodes as any, edges as any)

  // Assert
  expect(res.isValid).toBe(false)
  expect(res.issues.some((i: any) => i.nodeId === "cnd" && i.message.includes('sin condición'))).toBe(true)
})
})