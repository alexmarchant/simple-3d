export interface Point {
  x: number
  y: number
}

export interface Vertex {
  x: number
  y: number
  z: number
  texMap?: TextureMap
  norm?: Vector3D
}

export interface Rotation3D {
  x: number
  y: number
}

export interface Polygon {
  a: Vertex,
  b: Vertex,
  c: Vertex,
  color: string,
}

export interface Vector3D {
  x: number,
  y: number,
  z: number,
}

export interface Vector2D {
  x: number,
  y: number,
}

export interface TextureMap {
  u: number,
  v: number,
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let image = new Image()
    image.onload = () => resolve(image)
    image.src = url
  })
}

export async function loadBitmap(url: string): Promise<ImageBitmap> {
  const image = await loadImage(url)
  const bitmap = await window.createImageBitmap(image)
  return bitmap
}