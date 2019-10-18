import { Polygon, Point, Vertex, Vector3D, loadBitmap} from './common'
import { Mesh } from './mesh'
import { Camera } from './camera'
import * as _ from 'lodash'

declare global {
  interface Window {
    renderer: Renderer
  }
}

interface RendererOptions {
  canvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
  meshes: Mesh[],
  textureURL: string,
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
  textureURL: string
  textureBitmap: ImageBitmap
  renderPolys = true
  renderEdges = false
  renderVerts = false
  renderVertNorms = false
  renderFaceNorms = false
  normLineLength = 3
  throttledConsole = _.throttle((...a) => console.log(a), 100)
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
    this.textureURL = options.textureURL
    this.camera = new Camera()

    this.showFPS = this.showFPS.bind(this)
    this.showD = this.showD.bind(this)
    window.renderer = this
  }

  async start() {
    this.textureBitmap = await loadBitmap(this.textureURL)
    const throttledShowFPS = _.throttle(this.showFPS, 333)
    const throttledShowD = _.throttle(this.showD, 333)

    this.intervalID = window.setInterval(() => {
      const frameDuration: number = new Date().getTime() - this.lastFrameDate.getTime()
      this.addFrameDurationToCache(frameDuration)
      throttledShowFPS()
      throttledShowD()
      this.camera.move(frameDuration)
      this.render()
      this.lastFrameDate = new Date()
    }, 1000 / this.fps)
  }

  render() {
    this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    this.renderMeshes()
  }

  renderMeshes() {
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
          this.renderLine(polygon.a, polygon.b, '#ddd')
          this.renderLine(polygon.b, polygon.c, '#ddd')
          this.renderLine(polygon.c, polygon.a, '#ddd')
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

    if (this.renderVertNorms) {
      this.meshes.forEach(mesh => {
        mesh.polygons.forEach(polygon => {
          this.renderVertNorm(polygon.a, 'blue')
          this.renderVertNorm(polygon.b, 'blue')
          this.renderVertNorm(polygon.c, 'blue')
        })
      })
    }

    if (this.renderFaceNorms) {
      this.meshes.forEach(mesh => {
        mesh.polygons.forEach(polygon => {
          this.renderFaceNorm(polygon, 'purple')
        })
      })
    }
  }

  renderPolygon(polygon: Polygon) {
    if (!this.polygonNormalFacingCamera(polygon)) {
      return
    }

    const cameraVertexA = this.orientVertexForCamera(polygon.a)
    const pointA = this.projectVertex(cameraVertexA)
    const cameraVertexB = this.orientVertexForCamera(polygon.b)
    const pointB = this.projectVertex(cameraVertexB)
    const cameraVertexC = this.orientVertexForCamera(polygon.c)
    const pointC = this.projectVertex(cameraVertexC)

    // Skip triangles not in front of the camera
    if (Math.min(cameraVertexA.z, cameraVertexB.z, cameraVertexC.z) <= 0) {
      return
    }

    this.mapTexture(polygon.a, pointA, polygon.b, pointB, polygon.c, pointC)
    // Use this for drawing plain colors
    // this.drawTriangle(pointA, pointB, pointC, polygon.color)
    this.addShading(polygon, pointA, pointB, pointC)
  }

  renderLine(vertexA: Vertex, vertexB: Vertex, color: string) {
    const cameraVertexA = this.orientVertexForCamera(vertexA)
    const pointA = this.projectVertex(cameraVertexA)
    const cameraVertexB = this.orientVertexForCamera(vertexB)
    const pointB = this.projectVertex(cameraVertexB)

    // Skip lines not in front of the camera
    if (Math.min(cameraVertexA.z, cameraVertexB.z) <= 0) {
      return
    }

    this.drawLine(pointA, pointB, color)
  }

  renderVertex(vertex: Vertex, radius: number, color: string) {
    const cameraVertex = this.orientVertexForCamera(vertex)
    const point = this.projectVertex(cameraVertex)

    // Skip verts not in front of the camera
    if (cameraVertex.z <= 0) {
      return
    }
    
    this.drawPoint(point, radius, color)
  }

  renderVertNorm(vertex: Vertex, color: string) {
    const lineStart = vertex
    const lineEnd: Vertex = {
      x: vertex.x + vertex.norm.x * this.normLineLength,
      y: vertex.y + vertex.norm.y * this.normLineLength,
      z: vertex.z + vertex.norm.z * this.normLineLength,
    }

    const cameraStartVertex = this.orientVertexForCamera(lineStart)
    const cameraEndVertex = this.orientVertexForCamera(lineEnd)
    const startPoint = this.projectVertex(cameraStartVertex)
    const endPoint = this.projectVertex(cameraEndVertex)

    if (Math.min(cameraStartVertex.z, cameraEndVertex.z) <= 0) {
      return
    }

    this.drawLine(startPoint, endPoint, color)
  }

  renderFaceNorm(polygon: Polygon, color: string) {
    const norm = this.polygonNormal(polygon)
    const lineStart: Vertex = {
      x: (polygon.a.x + polygon.b.x + polygon.c.x) / 3,
      y: (polygon.a.y + polygon.b.y + polygon.c.y) / 3,
      z: (polygon.a.z + polygon.b.z + polygon.c.z) / 3,
    }
    const lineEnd: Vertex = {
      x: lineStart.x + norm.x * this.normLineLength,
      y: lineStart.y + norm.y * this.normLineLength,
      z: lineStart.z + norm.z * this.normLineLength,
    }

    const cameraStartVertex = this.orientVertexForCamera(lineStart)
    const cameraEndVertex = this.orientVertexForCamera(lineEnd)
    const startPoint = this.projectVertex(cameraStartVertex)
    const endPoint = this.projectVertex(cameraEndVertex)

    if (Math.min(cameraStartVertex.z, cameraEndVertex.z) <= 0) {
      return
    }

    this.drawLine(startPoint, endPoint, color)
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

  // https://stackoverflow.com/a/4774298/778552
  mapTexture(vertexA: Vertex, pointA: Point, vertexB: Vertex, pointB: Point, vertexC: Vertex, pointC: Point) {
    const canvasPointA = this.translateToCanvasPoint(pointA)
    const canvasPointB = this.translateToCanvasPoint(pointB)
    const canvasPointC = this.translateToCanvasPoint(pointC)

    // Converting to x0 style coord names to use the matrix algo below from stack overflow,
    // don't want to convert their style to mine for risk of messing it up
    const x0 = canvasPointA.x
    const x1 = canvasPointB.x
    const x2 = canvasPointC.x
    const y0 = canvasPointA.y
    const y1 = canvasPointB.y
    const y2 = canvasPointC.y
    const u0 = vertexA.texMap.u * this.textureBitmap.width
    const u1 = vertexB.texMap.u * this.textureBitmap.width
    const u2 = vertexC.texMap.u * this.textureBitmap.width
    const v0 = (1 - vertexA.texMap.v) * this.textureBitmap.height
    const v1 = (1 - vertexB.texMap.v) * this.textureBitmap.height
    const v2 = (1 - vertexC.texMap.v) * this.textureBitmap.height

    // Set clipping area so that only pixels inside the triangle will
    // be affected by the image drawing operation
    this.context.save()
    this.context.beginPath()
    this.context.moveTo(x0, y0)
    this.context.lineTo(x1, y1)
    this.context.lineTo(x2, y2)
    this.context.lineTo(x0, y0)
    this.context.closePath()
    this.context.clip()

    // Compute matrix transform
    var delta = u0*v1 + v0*u2 + u1*v2 - v1*u2 - v0*u1 - u0*v2;
    var delta_a = x0*v1 + v0*x2 + x1*v2 - v1*x2 - v0*x1 - x0*v2;
    var delta_b = u0*x1 + x0*u2 + u1*x2 - x1*u2 - x0*u1 - u0*x2;
    var delta_c = u0*v1*x2 + v0*x1*u2 + x0*u1*v2 - x0*v1*u2 - v0*u1*x2 - u0*x1*v2
    var delta_d = y0*v1 + v0*y2 + y1*v2 - v1*y2 - v0*y1 - y0*v2;
    var delta_e = u0*y1 + y0*u2 + u1*y2 - y1*u2 - y0*u1 - u0*y2;
    var delta_f = u0*v1*y2 + v0*y1*u2 + y0*u1*v2 - y0*v1*u2 - v0*u1*y2 - u0*y1*v2

    // Draw the transformed image
    this.context.transform(delta_a/delta, delta_d/delta, delta_b/delta, delta_e/delta, delta_c/delta, delta_f/delta)
    this.context.drawImage(this.textureBitmap, 0, 0)
    
    this.context.restore()
  }

  addShading(polygon: Polygon, pointA: Point, pointB: Point, pointC: Point) {
    const shadowStrength = 0.3
    const normal = this.polygonNormal(polygon)
    const cameraNormal = this.cameraNormal()
    const dotProduct = this.dotProduct(normal, cameraNormal)
    // Backlit
    const alpha = (Math.abs(dotProduct)) * shadowStrength
    // Frontlit
    // const alpha = (1 - Math.abs(dotProduct)) * shadowStrength
    this.drawTriangle(pointA, pointB, pointC, `rgba(0, 0, 0, ${alpha})`)
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

  addFrameDurationToCache(frameDuration: number) {
    // Set current frame duration and set the index
    this.frameDurationCache[this.frameDurationCacheCurrentIndex] = frameDuration
    this.frameDurationCacheCurrentIndex += 1
    const maxFPSCacheSize = 30
    if (this.frameDurationCacheCurrentIndex >= maxFPSCacheSize) {
      this.frameDurationCacheCurrentIndex = 0
    }
  }

  showFPS() {
    if (!this.fpsElement) {
      this.fpsElement = document.getElementById('fps')
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

  polygonNormal(polygon: Polygon): Vector3D {
    // Average out vertex normals
    const x = (polygon.a.norm.x + polygon.b.norm.x + polygon.c.norm.x) / 3
    const y = (polygon.a.norm.y + polygon.b.norm.y + polygon.c.norm.y) / 3
    const z = (polygon.a.norm.z + polygon.b.norm.z + polygon.c.norm.z) / 3
    return {
      x,
      y,
      z,
    }
  }

  normalize(vector: Vector3D) {
    const mag = this.magnitude(vector)
    return {
      x: vector.x / mag,
      y: vector.y / mag,
      z: vector.z / mag,
    }
  }

  magnitude(vector: Vector3D) {
    return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2)
  }

  cameraNormal(): Vector3D {
    // Use dot product to convert angle to vectors, first we get the z vector
    // then compute the x vector from whats left over

    // Dot product, we know angle between starting normal and current normal,
    // need to solve for current normal
    // const startingNormal = { x: 0, y: 0, z: 1 }
    // cam.x * start.x + cam.y * start.y + cam.z * start.z = cos(theta)
    // cam.x * 0 + cam.y * 0 + cam.z * 1 = cos(theta)
    // 0 + 0 + cam.z = cos(theta)
    // cam.z = cos(theta)
    const nonRepeatingXAngle = this.camera.rotation.x % 360
    const xAngleRads = nonRepeatingXAngle * (Math.PI / 180)
    const z = Math.cos(xAngleRads)

    // 1 = sqrt(x^2 + y^2 + z^2)
    // 1 = sqrt(x^2 + 0^2 + z^2)
    // 1 = sqrt(x^2 + z^2)
    // 1^2 = x^2 + z^2
    // 1 - z^2 = x^2
    // x = sqrt(1-z^2)
    let x = Math.sqrt(1 - z ** 2)
    if (nonRepeatingXAngle >= 180) {
      x = -x
    }
    const y = 0
    return {
      x: x,
      y: y,
      z: z,
    }
  }

  dotProduct(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  polygonNormalFacingCamera(polygon: Polygon): boolean {
    const normal = this.polygonNormal(polygon)
    const cameraNormal = this.cameraNormal()
    const dotProduct = this.dotProduct(normal, cameraNormal)
    return dotProduct < 0
  }
}
