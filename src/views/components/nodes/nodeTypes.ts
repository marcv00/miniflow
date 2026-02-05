import StartNode from "./StartNode"
import CommandNode from "./CommandNode"
import HttpRequestNode from "./HttpRequestNode"
import ConditionalNode from "./ConditionalNode"
import EndNode from "./EndNode"

export const nodeTypes = {
  start: StartNode,
  http_request: HttpRequestNode,
  conditional: ConditionalNode,
  command: CommandNode,
  end: EndNode
}
