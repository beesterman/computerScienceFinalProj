import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toRadians } from './js/helper'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const textureLoader = new THREE.TextureLoader();

// this is the controlls for the mouse
const CameraControls = new OrbitControls(camera, renderer.domElement);
CameraControls.minDistance = 0;
CameraControls.maxDistance = 3000;
CameraControls.zoomToCursor = true;

const pressedKeys = new Set();
const cameraMoveSpeed = 40;
const cameraMoveDirection = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const orbitPoint = new THREE.Vector3();
let previousFrameTime = 0;

window.addEventListener('keydown', (event) => {
  pressedKeys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  pressedKeys.delete(event.code);
});

let ambientLight = new THREE.AmbientLight(0x404040);

scene.add(ambientLight);

//---------------------------------------------------------------------
// local functions
// ---------------------------------------------------------------------
function updatePlanetRotation(planet, time = performance.now()) {
  const seconds = time / 1000;
  const orbitProgress = (seconds / planet.orbitalSpeed) % earth.orbitalSpeed;

  const p = planet.elipse.getPoint(orbitProgress);
  orbitPoint.set(p.x, p.y, 0);
  planet.orbitLine.updateWorldMatrix(true, false);
  planet.orbitLine.localToWorld(orbitPoint);

  planet.planetGroup.position.copy(orbitPoint);
}

function updateCameraMovement(deltaSeconds) {
  cameraMoveDirection.set(0, 0, 0);

  camera.getWorldDirection(cameraForward);
  cameraRight.crossVectors(cameraForward, camera.up).normalize();

  if (pressedKeys.has('KeyW')) {
    cameraMoveDirection.add(cameraForward);
  }
  if (pressedKeys.has('KeyS')) {
    cameraMoveDirection.sub(cameraForward);
  }
  if (pressedKeys.has('KeyA')) {
    cameraMoveDirection.sub(cameraRight);
  }
  if (pressedKeys.has('KeyD')) {
    cameraMoveDirection.add(cameraRight);
  }

  if (cameraMoveDirection.lengthSq() === 0) {
    return;
  }

  cameraMoveDirection.normalize().multiplyScalar(cameraMoveSpeed * deltaSeconds);
  camera.position.add(cameraMoveDirection);
  CameraControls.target.add(cameraMoveDirection);
  CameraControls.update();
}




//---------------------------------------------------------------------
// Skybox
// ---------------------------------------------------------------------

// skybox
const skyboxCubemap = new THREE.CubeTextureLoader().load([
  'statics/cubemaps/px.png',
  'statics/cubemaps/nx.png',
  'statics/cubemaps/py.png',
  'statics/cubemaps/ny.png',
  'statics/cubemaps/pz.png',
  'statics/cubemaps/nz.png',

]);

scene.background = skyboxCubemap;



//---------------------------------------------------------------------
// Planet info setup
// ---------------------------------------------------------------------
// setting up blueprint for planets
class Planet {
    constructor(size, rotationSpeed, orbitalSpeed, axialTilt, orbitSize, orbitalTilt, orbitLine, planetGroup) {
        //these are calculated using meteres as a ratio
        this.size = size
        this.rotationSpeed = rotationSpeed
        this.orbitalSpeed = orbitalSpeed
        this.axialTilt = axialTilt
        // This is calculated using AU
        this.orbitSize = orbitSize
        this.orbitalTilt = orbitalTilt
        //this is the points from the orbit calculated above
        this.orbitLine = orbitLine
        this.planetGroup = planetGroup
    }
}

// find the info used to calculate these numbers here: https://science.nasa.gov/solar-system/planets/planet-sizes-and-locations-in-our-solar-system/
let earth = new Planet(1.0, 0.05, 1000.0, 23.5, 50.0, -90.0);
let jupiter = new Planet(earth.size * 11.2, earth.rotationSpeed * 0.41, earth.orbitalSpeed * 11.8, 3.0, earth.orbitSize * 5.2, earth.orbitalTilt + 1.31);
let saturn = new Planet(earth.size * 9.45, earth.rotationSpeed * 0.45, earth.orbitalSpeed * 11.8, 26.37, earth.orbitSize * 9.5, earth.orbitalTilt + 2.49);
let uranus = new Planet(earth.size * 4.0, earth.rotationSpeed * 0.71, earth.orbitalSpeed * 84, 97.77, earth.orbitSize * 19.2, earth.orbitalTilt + 0.77);
let neptune = new Planet(earth.size * 3.88, earth.rotationSpeed * 0.67, earth.orbitalSpeed * 165.0, 28.0, earth.orbitSize * 30.1, earth.orbitalTilt + 1.77);
let venus = new Planet(earth.size * 0.95, earth.rotationSpeed * 0.004, earth.orbitalSpeed * 0.61, 3.0, earth.orbitSize * 0.72, earth.orbitalTilt + 3.39);
let mars = new Planet(earth.size * 0.53, earth.rotationSpeed * 1.025, earth.orbitalSpeed * 1.88, 25.0, earth.orbitSize * 1.52, earth.orbitalTilt + 1.85);
let mercury = new Planet(earth.size * 0.38, earth.rotationSpeed * 59.0, earth.orbitalSpeed * 0.241, 2.0, earth.orbitSize * 0.39, earth.orbitalTilt + 7.01);
let pluto = new Planet(earth.size * 0.19, earth.rotationSpeed * 6.38, earth.orbitalSpeed * 248.0, 57.0, earth.orbitSize * 39.5, earth.orbitalTilt + 17.14);
let sun = new Planet(earth.size * 2.0, earth.rotationSpeed * 36.0, 0.0, 0);
const planetArray = [earth, jupiter, saturn, uranus, neptune, venus, mars, mercury, pluto]

//---------------------------------------------------------------------
// Orbital elipse setup
// ---------------------------------------------------------------------
//earth
let earthGroup = new THREE.Group()
const earthCurve = new THREE.EllipseCurve(
  0, 0, //center of the elipse
  earth.orbitSize, earth.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const earthPoints = earthCurve.getPoints(1000);
const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints(earthPoints);
const earthOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const earthOrbit = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
earthOrbit.rotateX(toRadians(earth.orbitalTilt))
earth.elipse = earthCurve;
earth.orbitLine = earthOrbit;
scene.add(earthOrbit)

//mercury
let mercuryGroup = new THREE.Group()
const mercuryCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 5, //center of the elipse x,y
  mercury.orbitSize, mercury.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const mercuryPoints = mercuryCurve.getPoints(1000);
const mercuryOrbitGeometry = new THREE.BufferGeometry().setFromPoints(mercuryPoints);
const mercuryOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const mercuryOrbit = new THREE.Line(mercuryOrbitGeometry, mercuryOrbitMaterial);
mercuryOrbit.rotateX(toRadians(mercury.orbitalTilt))
mercury.elipse = mercuryCurve;
mercury.orbitLine = mercuryOrbit;
scene.add(mercuryOrbit)

//venus
let venusGroup = new THREE.Group()
const venusCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 0, //center of the elipse x,y
  venus.orbitSize, venus.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const venusPoints = venusCurve.getPoints(1000);
const venusOrbitGeometry = new THREE.BufferGeometry().setFromPoints(venusPoints);
const venusOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const venusOrbit = new THREE.Line(venusOrbitGeometry, venusOrbitMaterial);
venusOrbit.rotateX(toRadians(venus.orbitalTilt))
venus.elipse = venusCurve;
venus.orbitLine = venusOrbit;
scene.add(venusOrbit)

//mars
let marsGroup = new THREE.Group()
const marsCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 0, //center of the elipse x,y
  mars.orbitSize, mars.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const marsPoints = marsCurve.getPoints(1000);
const marsOrbitGeometry = new THREE.BufferGeometry().setFromPoints(marsPoints);
const marsOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const marsOrbit = new THREE.Line(marsOrbitGeometry, marsOrbitMaterial);
marsOrbit.rotateX(toRadians(mars.orbitalTilt))
mars.elipse = marsCurve;
mars.orbitLine = marsOrbit;
scene.add(marsOrbit)

//jupiter
let jupiterGroup = new THREE.Group()
const jupiterCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 0, //center of the elipse x,y
  jupiter.orbitSize, jupiter.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const jupiterPoints = jupiterCurve.getPoints(1000);
const jupiterOrbitGeometry = new THREE.BufferGeometry().setFromPoints(jupiterPoints);
const jupiterOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const jupiterOrbit = new THREE.Line(jupiterOrbitGeometry, jupiterOrbitMaterial);
jupiterOrbit.rotateX(toRadians(jupiter.orbitalTilt))
jupiter.elipse = jupiterCurve;
jupiter.orbitLine = jupiterOrbit;
scene.add(jupiterOrbit)





//---------------------------------------------------------------------
// Plantet Geometry Setup
// ---------------------------------------------------------------------
// sun
const sunTexture = textureLoader.load('statics/images/sunTexture.jpg');
const sunGeometry = new THREE.SphereGeometry(sun.size);
const sunMaterial = new THREE.MeshBasicMaterial( { map: sunTexture } );
const sunSphere = new THREE.Mesh( sunGeometry, sunMaterial );
sunSphere.position.set(0,0,0)
scene.add( sunSphere );

const sunLight = new THREE.PointLight(0xffffff, 1, 0, 0.90 );
sunSphere.add(sunLight);
sunSphere.rotation.z += toRadians(sun.axialTilt);

// Earth

const earthTexture = textureLoader.load('statics/images/earthTexture.jpg')
const earthGeometry = new THREE.SphereGeometry(earth.size);
const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  shininess: 0.3,
});
const earthSphere = new THREE.Mesh( earthGeometry, earthMaterial );
earthSphere.rotation.z += toRadians(earth.axialTilt);
earthSphere.position.set(0,0,0);
earthGroup.add(earthSphere);
earth.planetGroup = earthGroup;
scene.add(earthGroup)

//mercury
const mercuryTexture = textureLoader.load('statics/images/mercuryTexture.jpg')
const mercuryGeometry = new THREE.SphereGeometry(mercury.size);
const mercuryMaterial = new THREE.MeshPhongMaterial({
  map: mercuryTexture,
  shininess: 0.3,
});
const mercurySphere = new THREE.Mesh( mercuryGeometry, mercuryMaterial );
mercurySphere.rotation.z += toRadians(mercury.axialTilt);
mercurySphere.position.set(0,0,0);
mercuryGroup.add(mercurySphere);
mercury.planetGroup = mercuryGroup;
scene.add(mercuryGroup)

//venus
const venusTexture = textureLoader.load('statics/images/venusTexture.jpg')
const venusGeometry = new THREE.SphereGeometry(venus.size);
const venusMaterial = new THREE.MeshPhongMaterial({
  map: venusTexture,
  shininess: 0.3,
});
const venusSphere = new THREE.Mesh( venusGeometry, venusMaterial );
venusSphere.rotation.z += toRadians(venus.axialTilt);
venusSphere.position.set(0,0,0);
venusGroup.add(venusSphere);
venus.planetGroup = venusGroup;
scene.add(venusGroup)

//mars
const marsTexture = textureLoader.load('statics/images/marsTexture.jpg')
const marsGeometry = new THREE.SphereGeometry(mars.size);
const marsMaterial = new THREE.MeshPhongMaterial({
  map: marsTexture,
  shininess: 0.3,
});
const marsSphere = new THREE.Mesh( marsGeometry, marsMaterial );
marsSphere.rotation.z += toRadians(mars.axialTilt);
marsSphere.position.set(0,0,0);
marsGroup.add(marsSphere);
mars.planetGroup = marsGroup;
scene.add(marsGroup)

//jupiter
const jupiterTexture = textureLoader.load('statics/images/jupiterTexture.jpg')
const jupiterGeometry = new THREE.SphereGeometry(jupiter.size);
const jupiterMaterial = new THREE.MeshPhongMaterial({
  map: jupiterTexture,
  shininess: 0.3,
});
const jupiterSphere = new THREE.Mesh( jupiterGeometry, jupiterMaterial );
jupiterSphere.rotation.z += toRadians(jupiter.axialTilt);
jupiterSphere.position.set(0,0,0);
jupiterGroup.add(jupiterSphere);
jupiter.planetGroup = jupiterGroup;
scene.add(jupiterGroup)








// configuring shadowmap
renderer.shadowMap.enabled = true;
sunLight.castShadow = true;
sunLight.power = 2000;

earthSphere.castShadow = true;
earthSphere.receiveShadow = true;
mercurySphere.castShadow = true;
mercurySphere.receiveShadow = true;
venusSphere.castShadow = true;
venusSphere.receiveShadow = true;
marsSphere.castShadow = true;
marsSphere.receiveShadow = true;
jupiterSphere.castShadow = true;
jupiterSphere.receiveShadow = true;

// configuring camera to be in a reasonable location
camera.position.set(-3.0 * earth.orbitSize, 3.0 * earth.orbitSize, 3.0 * earth.orbitSize);
CameraControls.target.set(0, 0, 0);
CameraControls.update();



function animate( time ) {
  const deltaSeconds = previousFrameTime === 0 ? 0 : (time - previousFrameTime) / 1000;
  previousFrameTime = time;


//---------------------------------------------------------------------
// Planet Rotation Update
// ---------------------------------------------------------------------
  //controlls the divisor for the time of rotation
  let divisor = 1000
  
  sunSphere.rotation.y = (time / divisor) * sun.rotationSpeed;
  earthSphere.rotation.y = (time / divisor) * earth.rotationSpeed;
  mercurySphere.rotation.y = (time / divisor) * mercury.rotationSpeed;
  venusSphere.rotation.y = -(time / divisor) * venus.rotationSpeed;
  marsSphere.rotation.y = (time / divisor) * mars.rotationSpeed;
  jupiterSphere.rotation.y = (time / divisor) * jupiter.rotationSpeed;
//---------------------------------------------------------------------
// Planet Orbital Rotation Update
// ---------------------------------------------------------------------

  updatePlanetRotation(earth, time);
  updatePlanetRotation(mercury, time);
  updatePlanetRotation(venus, time);
  updatePlanetRotation(mars, time);
  updatePlanetRotation(jupiter, time);



  updateCameraMovement(deltaSeconds);
  





  renderer.render( scene, camera );
} 
