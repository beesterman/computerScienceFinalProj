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
CameraControls.maxDistance = 300;
CameraControls.zoomToCursor = true;

const pressedKeys = new Set();
const cameraMoveSpeed = 40;
const cameraMoveDirection = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
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
  

  planet.planetGroup.position.x = p.x;
  planet.planetGroup.position.z = p.y;
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
    constructor(size, rotationSpeed, orbitalSpeed, axialTilt, orbitSize, elipse, planetGroup) {
        //these are calculated using meteres as a ratio
        this.size = size
        this.rotationSpeed = rotationSpeed
        this.orbitalSpeed = orbitalSpeed
        this.axialTilt = axialTilt
        // This is calculated using AU
        this.orbitSize = orbitSize
        //this is the points from the orbit calculated above
        this.elipse = elipse
        this.planetGroup = planetGroup
    }
}

// find the info used to calculate these numbers here: https://science.nasa.gov/solar-system/planets/planet-sizes-and-locations-in-our-solar-system/
let earth = new Planet(1.0, 0.05, 1000.0, 23.5, 100);
let jupiter = new Planet(earth.size * 11.2, earth.rotationSpeed * 0.41, earth.orbitalSpeed * 11.8, 3.0);
let saturn = new Planet(earth.size * 9.45, earth.rotationSpeed * 0.45, earth.orbitalSpeed * 11.8, 26.37);
let uranus = new Planet(earth.size * 4.0, earth.rotationSpeed * 0.71, earth.orbitalSpeed * 84, 97.77);
let neptune = new Planet(earth.size * 3.88, earth.rotationSpeed * 0.67, earth.orbitalSpeed * 165.0, 28.0);
let venus = new Planet(earth.size * 0.95, earth.rotationSpeed * 243.0, earth.orbitalSpeed * 225.0, 3.0);
let mars = new Planet(earth.size * 0.53, earth.rotationSpeed * 1.025, earth.orbitalSpeed * 687.0, 25.0);
let mercury = new Planet(earth.size * 0.38, earth.rotationSpeed * 59.0, earth.orbitalSpeed * 0.241, 2.0);
let pluto = new Planet(earth.size * 0.19, earth.rotationSpeed * 6.38, earth.orbitalSpeed * 248.0, 57.0);
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
earthOrbit.rotateX(toRadians(-90))
earth.elipse = earthCurve;
scene.add(earthOrbit)








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











// configuring shadowmap
renderer.shadowMap.enabled = true;
sunLight.castShadow = true;
sunLight.power = 2000;

earthSphere.castShadow = true;
earthSphere.receiveShadow = true;


// configuring camera to be in a reasonable location
camera.position.set(-3.0 * sun.size, 3.0 * sun.size, 3.0 * sun.size);
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

//---------------------------------------------------------------------
// Planet Orbital Rotation Update
// ---------------------------------------------------------------------

  updatePlanetRotation(earth, time);
  
  updateCameraMovement(deltaSeconds);
  





  renderer.render( scene, camera );
} 
