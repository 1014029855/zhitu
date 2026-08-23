<template>
  <div ref="host" class="immersive-scene" aria-hidden="true"></div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'

const host = ref(null)
let renderer
let frameId
let scene
let camera
let group

function buildScene() {
  if (!host.value) return
  const width = host.value.clientWidth || window.innerWidth
  const height = host.value.clientHeight || window.innerHeight

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100)
  camera.position.set(0, 0, 9)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
  renderer.setSize(width, height)
  host.value.appendChild(renderer.domElement)

  group = new THREE.Group()
  group.position.set(1.6, -0.2, 0)
  scene.add(group)

  const red = new THREE.MeshStandardMaterial({
    color: 0xff5043,
    roughness: 0.38,
    metalness: 0.08
  })
  const black = new THREE.MeshStandardMaterial({
    color: 0x161616,
    roughness: 0.5,
    metalness: 0.03
  })
  const white = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.02
  })

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.28, 2), red)
  core.rotation.set(0.4, 0.2, -0.2)
  group.add(core)

  const panelA = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.18, 0.18), white)
  panelA.position.set(-1.35, 0.9, -0.8)
  panelA.rotation.set(0.1, -0.42, 0.18)
  group.add(panelA)

  const panelB = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 0.16), black)
  panelB.position.set(1.46, -0.9, -0.44)
  panelB.rotation.set(-0.18, 0.54, -0.26)
  group.add(panelB)

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.025, 16, 180), ringMaterial)
  ring.rotation.set(Math.PI / 2, 0.16, 0.36)
  group.add(ring)

  const ringDark = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.018, 16, 180), new THREE.MeshBasicMaterial({ color: 0x161616, transparent: true, opacity: 0.55 }))
  ringDark.rotation.set(Math.PI / 2.2, -0.35, -0.28)
  group.add(ringDark)

  const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
  for (let index = 0; index < 18; index += 1) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), dotMaterial)
    const angle = index * 0.83
    dot.position.set(Math.cos(angle) * 3.1, Math.sin(index * 1.8) * 1.55, Math.sin(angle) * 0.8)
    group.add(dot)
  }

  const lightA = new THREE.DirectionalLight(0xffffff, 2.8)
  lightA.position.set(3, 4, 5)
  scene.add(lightA)
  scene.add(new THREE.AmbientLight(0xffffff, 1.4))
}

function resize() {
  if (!renderer || !host.value) return
  const width = host.value.clientWidth || window.innerWidth
  const height = host.value.clientHeight || window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function animate(time = 0) {
  frameId = requestAnimationFrame(animate)
  if (group) {
    group.rotation.y = time * 0.00022
    group.rotation.x = Math.sin(time * 0.00028) * 0.16
    group.position.y = Math.sin(time * 0.0007) * 0.14
  }
  renderer.render(scene, camera)
}

onMounted(() => {
  buildScene()
  resize()
  window.addEventListener('resize', resize)
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frameId)
  window.removeEventListener('resize', resize)
  renderer?.domElement?.remove()
  renderer?.dispose()
})
</script>

<style scoped>
.immersive-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.immersive-scene :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
