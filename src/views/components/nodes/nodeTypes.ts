import StartNode from "./StartNode"
import CommandNode from "./CommandNode"
import ConditionalNode from "./ConditionalNode"
import EndNode from "./EndNode"
import HttpRequestNode from "./HttpRequestNode"

export const nodeTypes = {
  start: StartNode,
  http_request: HttpRequestNode,
  command: CommandNode,
  conditional: ConditionalNode,
  end: EndNode
}