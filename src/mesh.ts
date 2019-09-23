import { Polygon, Vertex } from './common'

export class Mesh {
  polygons: Polygon[]

  constructor() {
    this.polygons = []
  }
}

export interface RectMeshOptions {
  topLeft: Vertex,
  topRight: Vertex,
  bottomRight: Vertex,
  bottomLeft: Vertex,
}

export class RectMesh extends Mesh {
  constructor(options: RectMeshOptions) {
    super()
    this.polygons.push({
      a: options.topLeft,
      b: options.topRight,
      c: options.bottomLeft,
    })
    this.polygons.push({
      a: options.topRight,
      b: options.bottomRight,
      c: options.bottomLeft,
    })
  }
}