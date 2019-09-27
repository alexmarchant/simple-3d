import { Polygon, Point, Vertex, loadBitmap} from './common'
import { Mesh } from './mesh'
import { Camera } from './camera'
import * as _ from 'lodash'

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
    // Skip triangles with normals facing away from camera
    // const normals = polygon.a.norm
    // const camX = this.convertDegToVec(this.camera.rotation.x)
    // const camY = this.convertDegToVec(this.camera.rotation.y)
    // x is left right
    // y is up down
    // if (Math.abs(normals.x - camX) <= 0.5) return
    // this.throttledConsole(JSON.stringify(normals))
    // if (normals.x > 0) return
    // if (normals.y > 0) return
    // if (normals.z > 0) return

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

  cameraDistance(vertex: Vertex): number {
    const x = Math.pow(this.camera.position.x - vertex.x, 2)
    const y = Math.pow(this.camera.position.y - vertex.y, 2)
    const z = Math.pow(this.camera.position.z - vertex.z, 2)
    const distance = Math.pow(x + y + z, 0.5)
    return distance
  }

  convertDegToVec(deg: number): number {
    const within360 = deg % 360
    let offsetDeg
    if (within360 < 180) {
      offsetDeg = within360
    } else {
      offsetDeg = Math.abs(within360 - 360)
    }
    return offsetDeg / 180
  }
}
