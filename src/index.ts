import { Renderer } from './renderer'
import { initPage } from './page'
import { ObjParser } from './obj-parser'
import fox from './models/low-poly-fox/low-poly-fox.obj'

const canvas = document.getElementById('canvas') as HTMLCanvasElement

const foxParser = new ObjParser(fox)
const renderer = new Renderer({
  canvas: canvas,
  canvasWidth: 640,
  canvasHeight: 480,
  meshes: foxParser.meshes(),
})
renderer.camera.position.x = -84
renderer.camera.position.y = 43
renderer.camera.position.z = 67
renderer.camera.rotation.x = 122
renderer.start()
initPage(renderer)
