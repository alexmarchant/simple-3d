import { Polygon, Point, Vertex} from './common'
import { Mesh } from './mesh'
import { Camera } from './camera'

interface RendererOptions {
  canvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  meshes: Mesh[],
}

export class Renderer {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  canvasWidth: number
  canvasHeight: number
  playerPosition: Vertex
  camera: Camera
  meshes: Mesh[]
  intervalID: number 
  fpsElement: HTMLElement
  dElement: HTMLElement
  renderPolys = true
  renderEdges = false
  renderVerts = false
  d: number = 400
  fps: number = 60
  lastFrameDate = new Date()
  frameDurationCache: number[] = []
  frameDurationCacheCurrentIndex = 0

  constructor(options: RendererOptions) {
    this.canvas = options.canvas
    this.context = this.canvas.getContext('2d')
    this.canvasWidth = options.canvasWidth
    this.canvasHeight = options.canvasHeight
    this.meshes = options.meshes
    this.camera = new Camera()
  }

  start() {
    this.intervalID = window.setInterval(() => {
      const frameDuration: number = new Date().getTime() - this.lastFrameDate.getTime()
      this.showFPS(frameDuration)
      this.showD()
      this.camera.move(frameDuration)
      this.render()
      this.lastFrameDate = new Date()
    }, 1000 / this.fps)
  }

  render() {
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.renderShapes()
  }

  renderShapes() {
    if (this.renderPolys) {
      this.meshes.forEach(mesh => {
        mesh.polygons.forEach(polygon => {
          this.renderPolygon(polygon)
        })
      })
    }

    if (this.renderEdges) {
      this.meshes.forEach(mesh => {
        mesh.polygons.forEach(polygon => {
          this.renderLine(polygon.a, polygon.b, 'black')
          this.renderLine(polygon.b, polygon.c, 'black')
          this.renderLine(polygon.c, polygon.a, 'black')
        })
      })
    }

    if (this.renderVerts) {
      this.meshes.forEach(mesh => {
        mesh.polygons.forEach(polygon => {
          this.renderVertex(polygon.a, 3, 'red')
          this.renderVertex(polygon.b, 3, 'red')
          this.renderVertex(polygon.c, 3, 'red')
        })
      })
    }
  }

  renderPolygon(polygon: Polygon) {
    const cameraVertexA = this.orientVertexForCamera(polygon.a)
    const pointA = this.projectVertex(cameraVertexA)
    const cameraVertexB = this.orientVertexForCamera(polygon.b)
    const pointB = this.projectVertex(cameraVertexB)
    const cameraVertexC = this.orientVertexForCamera(polygon.c)
    const pointC = this.projectVertex(cameraVertexC)
    this.drawTriangle(pointA, pointB, pointC, polygon.color)
  }

  renderLine(vertexA: Vertex, vertexB: Vertex, color: string) {
    const cameraVertexA = this.orientVertexForCamera(vertexA)
    const pointA = this.projectVertex(cameraVertexA)
    const cameraVertexB = this.orientVertexForCamera(vertexB)
    const pointB = this.projectVertex(cameraVertexB)
    this.drawLine(pointA, pointB, color)
  }

  renderVertex(vertex: Vertex, radius: number, color: string) {
    const cameraVertex = this.orientVertexForCamera(vertex)
    const point = this.projectVertex(cameraVertex)
    this.drawPoint(point, radius, color)
  }

  projectVertex(vertex: Vertex): Point {
    const dz = this.d / vertex.z
    return {
      x: dz * vertex.x,
      y: dz * vertex.y,
    }
  }

  orientVertexForCamera(vertex: Vertex): Vertex {
    const offsetVertex = this.offsetVertexForCamera(vertex)
    const rotatedVertex = this.rotateVertexForCamera(offsetVertex)
    return rotatedVertex
  }

  offsetVertexForCamera(vertex: Vertex): Vertex {
    return {
      x: vertex.x - this.camera.position.x,
      y: vertex.y - this.camera.position.y,
      z: vertex.z - this.camera.position.z,
    }
  }

  rotateVertexForCamera(vertex: Vertex): Vertex {
    const center = { x: 0, y: 0, z: 0 } // camera has been offset already
    let rotatedX, rotatedY, rotatedZ

    // X rotation
    const radiansX = this.camera.rotation.x * (Math.PI / 180)
    rotatedX = Math.cos(radiansX) * (vertex.x - center.x) - Math.sin(radiansX) * (vertex.z - center.z) + center.x
    rotatedZ = Math.sin(radiansX) * (vertex.x - center.x) + Math.cos(radiansX) * (vertex.z - center.z) + center.z

    // Y rotation -- TODO, this aint workin
    // const radiansY = this.camera.rotation.y * (Math.PI / 180)
    // rotatedX = Math.cos(radiansY) * (vertex.y - center.y) - Math.sin(radiansY) * (vertex.x - center.x) + center.y
    // rotatedY = Math.sin(radiansY) * (vertex.y - center.y) + Math.cos(radiansY) * (vertex.x - center.x) + center.x

    return {
      x: rotatedX,
      y: vertex.y,
      z: rotatedZ,
    }
  }

  drawTriangle(pointA: Point, pointB: Point, pointC: Point, color: string) {
    const canvasPointA = this.translateToCanvasPoint(pointA)
    const canvasPointB = this.translateToCanvasPoint(pointB)
    const canvasPointC = this.translateToCanvasPoint(pointC)
    this.context.fillStyle = color
    this.context.strokeStyle = color
    this.context.beginPath()
    this.context.moveTo(canvasPointA.x, canvasPointA.y)
    this.context.lineTo(canvasPointB.x, canvasPointB.y)
    this.context.lineTo(canvasPointC.x, canvasPointC.y)
    this.context.lineTo(canvasPointA.x, canvasPointA.y)
    this.context.closePath()
    this.context.fill()
    this.context.stroke()
  }

  drawPoint(point: Point, radius: number, color: string) {
    const canvasPoint = this.translateToCanvasPoint(point)
    this.context.fillStyle = color
    this.context.beginPath()
    this.context.arc(canvasPoint.x, canvasPoint.y, radius, 0, Math.PI * 2)
    this.context.fill()
  }

  drawLine(pointA: Point, pointB: Point, color: string) {
    const canvasPointA = this.translateToCanvasPoint(pointA)
    const canvasPointB = this.translateToCanvasPoint(pointB)
    this.context.strokeStyle = color
    this.context.beginPath()
    this.context.moveTo(canvasPointA.x, canvasPointA.y)
    this.context.lineTo(canvasPointB.x, canvasPointB.y)
    this.context.closePath()
    this.context.stroke()
  }

  translateToCanvasPoint(point: Point): Point {
    return {
      x: (this.canvasWidth / 2) + point.x,
      y: (this.canvasHeight / 2) - point.y,
    }
  }

  showFPS(frameDuration: number) {
    if (!this.fpsElement) {
      this.fpsElement = document.getElementById('fps')
    }

    // Set current frame duration and set the index
    this.frameDurationCache[this.frameDurationCacheCurrentIndex] = frameDuration
    this.frameDurationCacheCurrentIndex += 1
    const maxFPSCacheSize = 30
    if (this.frameDurationCacheCurrentIndex >= maxFPSCacheSize) {
      this.frameDurationCacheCurrentIndex = 0
    }

    // Calculate the average frame duration
    const frameDurationSum = this.frameDurationCache.reduce((prev, cur) => {
      return prev + cur
    }, 0)
    const avgFrameDuration = frameDurationSum / this.frameDurationCache.length
    const fps = Math.round(1000 / avgFrameDuration)
    this.fpsElement.innerText = fps.toString()
  }

  showD() {
    if (!this.dElement) {
      this.dElement = document.getElementById('fov')
    }

    this.dElement.innerText = this.d.toString()
  }

  cameraDistance(vertex: Vertex): number {
    const x = Math.pow(this.camera.position.x - vertex.x, 2)
    const y = Math.pow(this.camera.position.y - vertex.y, 2)
    const z = Math.pow(this.camera.position.z - vertex.z, 2)
    const distance = Math.pow(x + y + z, 0.5)
    return distance
  }
}
