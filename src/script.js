import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import * as C from 'cannon'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

//loaders
const fontLoader = new THREE.FontLoader();

// Scene
const scene = new THREE.Scene()

const world = new C.World()
world.gravity.set(0, -50, 0)

const fog = new THREE.Fog(0x202533, 0.1, 100)

//constants
const totalMass = 1
const cMaterial = new C.Material()
const worldMat = new C.Material()
const words = []
const distance = 15
const margin = 6
const force = 25

const colors = [
    {
        from : new THREE.Color('#ff699f'),
        to   : new THREE.Color('#a769ff'),
    },
    {
        from : new THREE.Color('#683fee'),
        to   : new THREE.Color('#527ee1'),
    },
    {
        from : new THREE.Color('#ee663f'),
        to   : new THREE.Color('#f5678d'),
    },
    {
        from : new THREE.Color('#ee9ca7'),
        to   : new THREE.Color('#ffdde1'),
    },
    {
        from : new THREE.Color('#f7971e'),
        to   : new THREE.Color('#ffd200'),
    },
    {
        from : new THREE.Color('#56ccf2'),
        to   : new THREE.Color('#2f80ed'),
    },
    {
        from : new THREE.Color('#fc5c7d'),
        to   : new THREE.Color('#6a82fb'),
    },
    {
        from : new THREE.Color('#dce35b'),
        to   : new THREE.Color('#45b649'),
    },
]

//TEXT
const $text = Array.from(document.querySelectorAll('.mainNav a'))

fontLoader.load(
'/font/Regular.json',
(font) =>
{   
        
        // for (let i = 0; i < text.length; i++) {
        //     console.log(text[i].innerText);
        // }

        const offset = $text.length * margin * 0.5

        Array.from($text).reverse().forEach(($item, i) => {
            const { innerText } = $item

            const words = new THREE.Group()
            words.leteroff = 0

            words.ground = new C.Body({
                mass: 0,
                shape: new C.Box(new C.Vec3(50, 50, 0.1)),
                quaternion: new C.Quaternion().setFromEuler(Math.PI / -2, 0, 0),
                position: new C.Vec3(0, i * margin - offset, 0),
                material: worldMat,
            })

        words.isGroundDisplayed = false

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
        const randomColor = pick(colors)

     

    Array.from(words).forEach((word, j) => {
    for (let i = 0; i < word.children.length; i++) {
        const letter = word.children[i];

        letter.position.copy(letter.body.position);
        letter.quaternion.copy(letter.body.quaternion);
      }
    })

        Array.from(innerText).forEach((letter, j) => {
            const progress = (j) / (innerText.length - 1)

            const material = new THREE.MeshPhongMaterial({ color: randomColor.from.clone().lerp(randomColor.to, progress) })
            const geometry = new THREE.TextBufferGeometry(letter, {
                font: font,
                size: 3,
                height: 0.4,
                curveSegments: 24,
                bevelEnabled: true,
                bevelThickness: 0.4,
                bevelSize: 0.1,
                bevelOffset: 0,
                bevelSegments: 10                          
                    
            })

            geometry.computeBoundingBox()
            geometry.computeBoundingSphere()
            geometry.center()

            const mesh = new THREE.Mesh(geometry, material)

            // Get size
            mesh.size = mesh.geometry.boundingBox.getSize(new THREE.Vector3())
            mesh.size.multiply(new THREE.Vector3(0.5, 0.5, 0.5))

            

            // Cannon.js
            words.leteroff += mesh.size.x 

            mesh.position.set(words.leteroff * 2, ($text.length - 1 - i) * margin - offset, 0)
            mesh.positionOffset  = new C.Vec3(mesh.position.x, mesh.position.y + (i + 1) * 30 + 30 + j * 0.01, mesh.position.z)

            const box = new C.Box(new C.Vec3(mesh.size.x, mesh.size.y, mesh.size.z))

            mesh.body = new C.Body({
                mass: totalMass / innerText.length,
                position: mesh.positionOffset,
                material: cMaterial,
                    // linearDamping: 0.1,
                angularDamping: 0.99,
            }) 
            const { center } = mesh.geometry.boundingSphere;
            mesh.body.addShape(box, new C.Vec3(center.x, center.y, center.z));
            mesh.body.addShape(box, new C.Vec3(mesh.geometry.boundingSphere.center.x, mesh.geometry.boundingSphere.center.y, mesh.geometry.boundingSphere.center.z))

            
            world.addBody(mesh.body)
            words.add(mesh)
            //console.log()

        })  

    words.children.forEach((letter) => {
        letter.body.position.x -= words.len
    })
    
    //words.push(words)
    if (Array.isArray(words)) {
        words.push(words);
    }

    scene.add(words)
    //console.log(words)

    })

     words.forEach((word) => {
        for (let i = 0; i < word.children.length; i++) {
            const letter = word.children[i]
            const nextLetter = i + 1 === word.children.length ? null : word.children[i + 1]

            if (!nextLetter) continue

            const dist = letter.body.position.distanceTo(nextLetter.body.position)

            const c = new C.DistanceConstraint(letter.body, nextLetter.body, dist, 1e3)
            c.collideConnected = true

            world.addConstraint(c)
        }
    })
    

})

/**
 * Object
 */
const object1 = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff0000' })
)
object1.position.x = - 2
scene.add(object1)

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster()
let currentIntersect = null

const rayOrigin = new THREE.Vector3(- 3, 0, 0)
const rayDirection = new THREE.Vector3(10, 0, 0)
rayDirection.normalize()

// raycaster.set(rayOrigin, rayDirection)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Mouse
 */
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) =>
{
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(scene.children, true)
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : ''
})



document.addEventListener('click', () =>
{
    // if(currentIntersect)
    // {
    //     switch(currentIntersect.object)
    //     {
    //         case object1:

    //             console.log('click on object 1')
    //             break


    //         case fruits:
    //             if (intersects.length > 0) {
    //                 const obj = intersects[0]
    //                 const { object, face } = obj
        
    //             if (!object.isMesh) return
    //             const impulse = new C.Vec3().copy(face.normal).scale(-force);
    
    //             words.forEach((word, i) => {
    //                 word.children.forEach((letter) => {
    //                     const { body } = letter
    
    //                     if (letter !== object) return
    
    //                     body.applyLocalImpulse(impulse, new C.Vec3())
    //                 })})}
    //             console.log('letter')
    //             break
    //     }
    // }

    raycaster.setFromCamera(mouse, camera)

        // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) 
    {
        const obj = intersects[0]
        const { object, face } = obj

        if (!object.isMesh) return

        const impulse = new C.Vec3().copy(face.normal).scale(- force);

        Array.from(words).forEach((word, i) => {
            word.children.forEach((letter) => {
                const { body } = letter

                if (letter !== object) return

                body.applyLocalImpulse(impulse, new C.Vec3())
            })

        })

        
        console.log('hello')

    }
})



/*
* Lights
*/ 

const ambientLight = new THREE.AmbientLight(0xcccccc);
scene.add(ambientLight);

    const foreLight = new THREE.DirectionalLight(0xffffff, 0.5);
    foreLight.position.set(5, 5, 20);
scene.add(foreLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(-5, -5, -10);
scene.add(backLight);

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(15, -2, 20)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Animate objects
    object1.position.y = Math.sin(elapsedTime * 0.3) * 1.5
    
    // Cast a ray from the mouse and handle events
    raycaster.setFromCamera(mouse, camera)

    const objectsToTest = [object1]
    const intersects = raycaster.intersectObjects(scene.children, true)
    
    if(intersects.length)
    {
        if(!currentIntersect)
        {  
        
            console.log('mouse enter')
        }

        
        currentIntersect = intersects[0]
    }
    else
    {
        if(currentIntersect)
        {
            console.log('mouse leave')
        }
        
        currentIntersect = null
    }

    

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()