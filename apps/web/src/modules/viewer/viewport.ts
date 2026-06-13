import {
  RenderingEngine,
  Enums,
  type Types,
  EVENTS,
} from '@cornerstonejs/core'
import {
  ToolGroupManager,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  Enums as ToolEnums,
} from '@cornerstonejs/tools'

const ENGINE_ID = 'opendicom-engine'
const VIEWPORT_ID = 'main-viewport'
const TOOL_GROUP_ID = 'main-tool-group'

let renderingEngine: RenderingEngine | null = null

function getEngine(): RenderingEngine {
  if (!renderingEngine) {
    renderingEngine = new RenderingEngine(ENGINE_ID)
  }
  return renderingEngine
}

export function enableViewport(element: HTMLDivElement): Types.IStackViewport {
  const engine = getEngine()
  engine.enableElement({
    viewportId: VIEWPORT_ID,
    type: Enums.ViewportType.STACK,
    element,
    defaultOptions: { background: [0, 0, 0] as [number, number, number] },
  })

  let toolGroup = ToolGroupManager.getToolGroup(TOOL_GROUP_ID)
  if (!toolGroup) {
    toolGroup = ToolGroupManager.createToolGroup(TOOL_GROUP_ID)!
    toolGroup.addTool(WindowLevelTool.toolName)
    toolGroup.addTool(PanTool.toolName)
    toolGroup.addTool(ZoomTool.toolName)
    toolGroup.addTool(StackScrollTool.toolName)

    toolGroup.setToolActive(WindowLevelTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
    })
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
    })
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }],
    })
    toolGroup.setToolActive(StackScrollTool.toolName)
  }
  toolGroup.addViewport(VIEWPORT_ID, ENGINE_ID)

  return engine.getViewport(VIEWPORT_ID) as Types.IStackViewport
}

export function disableViewport(): void {
  if (!renderingEngine) return
  ToolGroupManager.getToolGroup(TOOL_GROUP_ID)?.removeViewports(ENGINE_ID, VIEWPORT_ID)
  renderingEngine.disableElement(VIEWPORT_ID)
}

export async function displayImage(
  viewport: Types.IStackViewport,
  imageIds: string[],
  index = 0
): Promise<void> {
  await viewport.setStack(imageIds, index)
  viewport.render()
}

export function captureCanvas(viewport: Types.IStackViewport): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    // IMAGE_RENDERED is dispatched on the viewport's DOM element, not the global eventTarget
    const el = viewport.element
    const handler = () => {
      el.removeEventListener(EVENTS.IMAGE_RENDERED, handler)
      resolve(viewport.canvas)
    }
    el.addEventListener(EVENTS.IMAGE_RENDERED, handler)
    viewport.render()
  })
}
