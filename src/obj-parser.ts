import { Mesh } from './mesh'
import { Vertex } from './common'

type Face = number[]

export class ObjParser {
  objSource: string
  verts: Vertex[]
  faces: Face[]

  constructor(objSource: string) {
    this.verts = []
    this.faces = []
    this.objSource = objSource
    this.parse()
  }

  parse() {
    const lines = this.objSource.split('\n')

    lines.forEach(line => {
      this.parseLine(line)
    })
  }

  parseLine(line: string) {
    if (line.match('^v ')) {
      this.parseVert(line)
    }
    if (line.match('^f ')) {
      this.parseFace(line)
    }
  }

  parseVert(line: string) {
    const parts = line.split(' ')
    const x = parseFloat(parts[1])
    const y = parseFloat(parts[2])
    const z = parseFloat(parts[3])
    this.verts.push({ x, y, z })
  }

  parseFace(line: string) {
    const indices: number[] = []

    const parts = line.split(' ').slice(1)
    parts.forEach(part => {
      const partParts = part.split('/')
      const index = parseInt(partParts[0], 10) - 1 // OBJ is 1 indexed
      indices.push(index)
    })

    this.faces.push(indices)
  }

  meshes(): Mesh[] {
    const mesh = new Mesh()

    this.faces.forEach(face => {
      const a = this.verts[face[0]]
      const b = this.verts[face[1]]
      const c = this.verts[face[2]]
      mesh.polygons.push({
        a,
        b,
        c,
        color: 'grey'
      })
    })

    return [mesh]
  }
}