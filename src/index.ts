import { Renderer } from './renderer'
import { Mesh, RectMesh } from './mesh'
import { initPage } from './page'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const meshes: Mesh[] = [
  new RectMesh({
    topLeft: { x: -10, y: 10, z: 50 },
    topRight: { x: 10, y: 10, z: 50 },
    bottomRight: { x: 10, y: -10, z: 50 },
    bottomLeft: { x: -10, y: -10, z: 50 },
    color: 'red',
  }),
  new RectMesh({
    topLeft: { x: 10, y: 10, z: 50 },
    topRight: { x: 10, y: 10, z: 30 },
    bottomRight: { x: 10, y: -10, z: 30 },
    bottomLeft: { x: 10, y: -10, z: 50 },
    color: 'blue',
  }),
  new RectMesh({
    topLeft: { x: -10, y: 10, z: 50 },
    topRight: { x: -10, y: 10, z: 30 },
    bottomRight: { x: -10, y: -10, z: 30 },
    bottomLeft: { x: -10, y: -10, z: 50 },
    color: 'yellow',
  }),
  new RectMesh({
    topLeft: { x: -10, y: -10, z: 30 },
    topRight: { x: 10, y: -10, z: 30 },
    bottomRight: { x: 10, y: -10, z: 50 },
    bottomLeft: { x: -10, y: -10, z: 50 },
    color: 'green',
  }),
  new RectMesh({
    topLeft: { x: -10, y: 10, z: 30 },
    topRight: { x: 10, y: 10, z: 30 },
    bottomRight: { x: 10, y: 10, z: 50 },
    bottomLeft: { x: -10, y: 10, z: 50 },
    color: 'purple',
  }),
  new RectMesh({
    topLeft: { x: -10, y: 10, z: 30 },
    topRight: { x: 10, y: 10, z: 30 },
    bottomRight: { x: 10, y: -10, z: 30 },
    bottomLeft: { x: -10, y: -10, z: 30 },
    color: 'orange',
  }),
]
const renderer = new Renderer({
  canvas: canvas,
  canvasWidth: 640,
  canvasHeight: 480,
  meshes: meshes,
})
renderer.start()
initPage(renderer)
