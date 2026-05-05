import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toRadians } from './js/helper'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 1000000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// setup for the label renderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);
const labelElement = document.createElement('div');
Object.assign(labelElement.style, {
    minWidth: '1.6rem',
    height: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '999px',
    background: 'rgba(8, 12, 24, 0.72)',
    color: 'white',
    display: 'grid',
    placeItems: 'center',
    font: '700 0.9rem Arial, sans-serif',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
    transform: 'translateY(-0.3rem)',
  });
const planetLabel = new CSS2DObject(labelElement);
planetLabel.visible = false;
scene.add(planetLabel);

const textureLoader = new THREE.TextureLoader();

// this is the controlls for the mouse
const CameraControls = new OrbitControls(camera, renderer.domElement);
CameraControls.minDistance = 0;
CameraControls.maxDistance = 3000;
CameraControls.zoomToCursor = true;
const cameraMoveSpeed = 800;

//This adds som ambient light so planets are visiable even from the dark side
let ambientLight = new THREE.AmbientLight(0x404040);

scene.add(ambientLight);

const pressedKeys = new Set();
const cameraMoveDirection = new THREE.Vector3();
const cameraForward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const cameraPlanetPos = new THREE.Vector3();
const orbitPoint = new THREE.Vector3();
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const hoverObjects = [];
const highlightColor = new THREE.Color(0x66ccff);
let previousFrameTime = 0;
let pointerIsOverCanvas = false;
let hoveredPlanet = null;
let clickedPlanet = null;
// determines the size of the line hitbox
raycaster.params.Line.threshold = 5.0;

//---------------------------------------------------------------------
// Event Listeners
// ---------------------------------------------------------------------
//adds event listeners for key up and down
window.addEventListener('keydown', (event) => {
  pressedKeys.add(event.code);
});

window.addEventListener('keyup', (event) => {
  pressedKeys.delete(event.code);
});

//adds event listeners for determining if pointer is in canvas or not and getting its position
renderer.domElement.addEventListener('pointermove', (event) => {
  updatePointerPosition(event);
  pointerIsOverCanvas = true;
});

renderer.domElement.addEventListener('pointerleave', () => {
  pointerIsOverCanvas = false;
});

renderer.domElement.addEventListener('click', (event) => {
  const hit = getPlanetHitFromPointer(event);

  if (!hit) {
    clickedPlanet = null;
    return;
  }

  clickedPlanet = hit.object.userData.planet;
  changeCameraPosition(clickedPlanet);
});


//---------------------------------------------------------------------
// local functions
// ---------------------------------------------------------------------
// gets the location of the pointer on the screen
function updatePointerPosition(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}
// casts a ray to detect what planet group was hit
function getPlanetHitFromPointer(event) {
  updatePointerPosition(event);
  scene.updateMatrixWorld(true);
  raycaster.setFromCamera(pointer, camera);

  return raycaster.intersectObjects(hoverObjects, false)[0] ?? null;
}

// changes camera position
function changeCameraPosition(planet){
  cameraPlanetPos.set(0,0,0);
  cameraPlanetPos.set(planet.size * 1.5, planet.size * 1.5, planet.size * 1.5);
  cameraPlanetPos.add(planet.currentWorldPos)
  console.log(planet.currentWorldPos);
  camera.position.copy(cameraPlanetPos);
  camera.lookAt(planet.currentWorldPos);
  CameraControls.target.copy(planet.currentWorldPos);
  CameraControls.update();
}
//generic function that takes in planet and current time and then calculates the current position
// of the planet and sets it accordingly
function updatePlanetRotation(planet, time = performance.now()) {
  const seconds = time / 1000;
  const orbitProgress = (seconds / planet.orbitalSpeed) % 1;

  const p = planet.elipse.getPoint(orbitProgress);
  orbitPoint.set(p.x, p.y, 0);
  planet.orbitLine.updateWorldMatrix(true, false);
  planet.orbitLine.localToWorld(orbitPoint);

  planet.currentWorldPos.copy(orbitPoint);
  planet.planetGroup.position.copy(orbitPoint);
}

function updateMoonRotation(moon, time = performance.now()) {
  const seconds = time / 1000;
  const orbitProgress = (seconds / moon.orbitalSpeed) % 1;

  const p = moon.elipse.getPoint(orbitProgress);

  orbitPoint.set(p.x, p.y, 0);
  orbitPoint.applyEuler(moon.orbitLine.rotation);

  moon.planetGroup.position.copy(orbitPoint);

  moon.planetGroup.updateWorldMatrix(true, false);
  moon.planetGroup.getWorldPosition(moon.currentWorldPos);
}

// adds/subs camera looking direction to the current camera direction to get new pos to make it look like you are flying
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

// have to do this to create a connection between the orbit and the planet that is on it
function addHoverTarget(object, planet) {
  object.userData.planet = planet;
  hoverObjects.push(object);
}

function createMoon(parentGroup, moon, texturePath) {
  const moonGroup = new THREE.Group();

  const moonTexture = textureLoader.load(texturePath);
  const moonGeometry = new THREE.SphereGeometry(moon.size);
  const moonMaterial = new THREE.MeshPhongMaterial({
    map: moonTexture,
    shininess: 0.3,
  });

  const moonSphere = new THREE.Mesh(moonGeometry, moonMaterial);
  moonSphere.rotation.z += toRadians(moon.axialTilt);
  moonGroup.add(moonSphere);

  moon.planetGroup = moonGroup;
  moon.planetMesh = moonSphere;

  parentGroup.add(moonGroup);
  addHoverTarget(moonSphere, moon);

  const moonCurve = new THREE.EllipseCurve(
    0, 0,
    moon.orbitSize, moon.orbitSize,
    0, 2 * Math.PI
  );

  const moonPoints = moonCurve.getPoints(200);
  const moonOrbitGeometry = new THREE.BufferGeometry().setFromPoints(moonPoints);
  const moonOrbitMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });

  const moonOrbit = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
  moonOrbit.rotateX(toRadians(moon.orbitalTilt));

  moon.elipse = moonCurve;
  moon.orbitLine = moonOrbit;

  parentGroup.add(moonOrbit);
  addHoverTarget(moonOrbit, moon);

  moonSphere.castShadow = true;
  moonSphere.receiveShadow = true;

  return moonSphere;
}

function setPlanetHighlight(planet, isHighlighted) {
  if (!planet) {
    return;
  }

  planet.orbitLine.material.color.set(isHighlighted ? highlightColor : 0xffffff);
  planet.orbitLine.material.opacity = isHighlighted ? 1 : 0.8;

  if (planet.planetMesh.material.emissive) {
    planet.planetMesh.material.emissive.set(isHighlighted ? highlightColor : 0x000000);
    planet.planetMesh.material.emissiveIntensity = isHighlighted ? 0.45 : 0;
  }
}

function activatePlanetLabel(planet, isLabeled){
  if (!isLabeled || !planet) {
    planetLabel.visible = false;
    return;
  }

  labelElement.textContent = planet.name;
  planetLabel.position.set(
    planet.currentWorldPos.x,
    planet.currentWorldPos.y + planet.size + 2,
    planet.currentWorldPos.z
  );
  planetLabel.visible = true;
}

function updateHoverHighlight() {
  if (!pointerIsOverCanvas) {
    setPlanetHighlight(hoveredPlanet, false);
    activatePlanetLabel(hoveredPlanet, false);
    hoveredPlanet = null;
    return;
  }

  scene.updateMatrixWorld(true);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(hoverObjects, false);
  const nextHoveredPlanet = hits.length > 0 ? hits[0].object.userData.planet : null;


  if (nextHoveredPlanet === hoveredPlanet) {
    activatePlanetLabel(hoveredPlanet, true);
    return;
  }

  setPlanetHighlight(hoveredPlanet, false);
  activatePlanetLabel(hoveredPlanet, false);
  hoveredPlanet = nextHoveredPlanet;
  setPlanetHighlight(hoveredPlanet, true);
  activatePlanetLabel(hoveredPlanet, true);
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
    constructor(name, size, rotationSpeed, orbitalSpeed, axialTilt, orbitSize, orbitalTilt, orbitLine, planetGroup) {
        this.name = name  
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
        this.currentWorldPos = new THREE.Vector3(0,0,0)
    }
}

// Helper function for orbital speeds
function computeOrbitalSpeed(distance, k = 0.05) {
  return Math.pow(distance, 1.5) * k;
}

// find the info used to calculate these numbers here: https://science.nasa.gov/solar-system/planets/planet-sizes-and-locations-in-our-solar-system/
let earth = new Planet("Earth", 1.0, 0.05, 10000.0, 23.5, 500.0, -90.0);
let jupiter = new Planet("Jupiter",earth.size * 11.2, earth.rotationSpeed * 2.42, earth.orbitalSpeed * 12.0, 3.0, earth.orbitSize * 5.2, earth.orbitalTilt + 1.31);
let saturn = new Planet("Saturn",earth.size * 9.45, earth.rotationSpeed * 2.24, earth.orbitalSpeed * 29.4, 26.37, earth.orbitSize * 9.5, earth.orbitalTilt + 2.49);
let uranus = new Planet("Uranus",earth.size * 4.0, earth.rotationSpeed * 0.71, earth.orbitalSpeed * 84, 97.77, earth.orbitSize * 19.2, earth.orbitalTilt + 0.77);
let neptune = new Planet("Neptune",earth.size * 3.88, earth.rotationSpeed * 0.67, earth.orbitalSpeed * 165.0, 28.0, earth.orbitSize * 30.1, earth.orbitalTilt + 1.77);
let venus = new Planet("Venus",earth.size * 0.95, earth.rotationSpeed * 0.004, earth.orbitalSpeed * 0.61, 3.0, earth.orbitSize * 0.72, earth.orbitalTilt + 3.39);
let mars = new Planet("Mars",earth.size * 0.53, earth.rotationSpeed * 1.025, earth.orbitalSpeed * 1.88, 25.0, earth.orbitSize * 1.52, earth.orbitalTilt + 1.85);
let mercury = new Planet("Mercury",earth.size * 0.38, earth.rotationSpeed * 59.0, earth.orbitalSpeed * 0.241, 2.0, earth.orbitSize * 0.39, earth.orbitalTilt + 7.01);
let pluto = new Planet("Pluto",earth.size * 0.19, earth.rotationSpeed * 6.38, earth.orbitalSpeed * 248.0, 57.0, earth.orbitSize * 39.5, earth.orbitalTilt + 17.14);
let sun = new Planet("Sun",earth.size * 100.0, earth.rotationSpeed * 36.0, 0.0, 0);
let moon = new Planet("Moon", earth.size * 0.27, earth.rotationSpeed * 0.036, earth.orbitalSpeed * 0.074, 6.68, earth.size*60, earth.orbitalTilt + 5.14)
let titan = new Planet( "Titan", earth.size * 0.40, earth.rotationSpeed * 0.064, computeOrbitalSpeed(saturn.size * 25), 0.3, saturn.size * 25, saturn.orbitalTilt + 0.35);
let rhea = new Planet(  "Rhea", earth.size * 0.12,earth.rotationSpeed * 0.22, computeOrbitalSpeed(saturn.size * 15),0.0, saturn.size * 15,saturn.orbitalTilt + 0.35);


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
addHoverTarget(earthOrbit, earth);



//mercury
let mercuryGroup = new THREE.Group()
const mercuryCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 1, //center of the elipse x,y
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
addHoverTarget(mercuryOrbit, mercury);

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
addHoverTarget(venusOrbit, venus);

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
addHoverTarget(marsOrbit, mars);

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
addHoverTarget(jupiterOrbit, jupiter);

//saturn
let saturnGroup = new THREE.Group()
const saturnCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 0, //center of the elipse x,y
  saturn.orbitSize, saturn.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const saturnPoints = saturnCurve.getPoints(1000);
const saturnOrbitGeometry = new THREE.BufferGeometry().setFromPoints(saturnPoints);
const saturnOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const saturnOrbit = new THREE.Line(saturnOrbitGeometry, saturnOrbitMaterial);
saturnOrbit.rotateX(toRadians(saturn.orbitalTilt))
saturn.elipse = saturnCurve;
saturn.orbitLine = saturnOrbit;
scene.add(saturnOrbit)
addHoverTarget(saturnOrbit, saturn);

//uranus
let uranusGroup = new THREE.Group()
const uranusCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 0, //center of the elipse x,y
  uranus.orbitSize, uranus.orbitSize, //x then y radiuneptunes
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const uranusPoints = uranusCurve.getPoints(1000);
const uranusOrbitGeometry = new THREE.BufferGeometry().setFromPoints(uranusPoints);
const uranusOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const uranusOrbit = new THREE.Line(uranusOrbitGeometry, uranusOrbitMaterial);
uranusOrbit.rotateX(toRadians(uranus.orbitalTilt))
uranus.elipse = uranusCurve;
uranus.orbitLine = uranusOrbit;
scene.add(uranusOrbit)
addHoverTarget(uranusOrbit, uranus);

//neptune
let neptuneGroup = new THREE.Group()
const neptuneCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 0, //center of the elipse x,y
  neptune.orbitSize, neptune.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const neptunePoints = neptuneCurve.getPoints(1000);
const neptuneOrbitGeometry = new THREE.BufferGeometry().setFromPoints(neptunePoints);
const neptuneOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const neptuneOrbit = new THREE.Line(neptuneOrbitGeometry, neptuneOrbitMaterial);
neptuneOrbit.rotateX(toRadians(neptune.orbitalTilt))
neptune.elipse = neptuneCurve;
neptune.orbitLine = neptuneOrbit;
scene.add(neptuneOrbit)
addHoverTarget(neptuneOrbit, neptune);

//pluto
let plutoGroup = new THREE.Group()
const plutoCurve = new THREE.EllipseCurve(
  //  need to shift the center of the curve to make it look like real life
  0, 0, //center of the elipse x,y
  pluto.orbitSize, pluto.orbitSize, //x then y radius
  0, 2 * Math.PI, //Start and end angle
)
// create a set of points from the elliptical curve then add a new material and add to scene. 
const plutoPoints = plutoCurve.getPoints(1000);
const plutoOrbitGeometry = new THREE.BufferGeometry().setFromPoints(plutoPoints);
const plutoOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })
const plutoOrbit = new THREE.Line(plutoOrbitGeometry, plutoOrbitMaterial);
plutoOrbit.rotateX(toRadians(pluto.orbitalTilt))
pluto.elipse = plutoCurve;
pluto.orbitLine = plutoOrbit;
scene.add(plutoOrbit)
addHoverTarget(plutoOrbit, pluto);


//---------------------------------------------------------------------
// Planet Geometry Setup
// ---------------------------------------------------------------------
// sun
const sunTexture = textureLoader.load('statics/images/sunTexture.jpg');
const sunGeometry = new THREE.SphereGeometry(sun.size);
const sunMaterial = new THREE.MeshBasicMaterial( { map: sunTexture } );
const sunSphere = new THREE.Mesh( sunGeometry, sunMaterial );
sunSphere.position.set(0,0,0)
scene.add( sunSphere );

const sunLight = new THREE.PointLight(0xffffff, 10000000, 0, 0.99999999);
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
earth.planetMesh = earthSphere;
scene.add(earthGroup)
addHoverTarget(earthSphere, earth);
// Adding the moon 
const moonSphere = createMoon(earthGroup, moon, 'statics/images/moonTexture.jpg');

// Earth axis 
const earthAxisPoints = [new THREE.Vector3(0,earth.size * 1.5,0), new THREE.Vector3(0,-1 * earth.size * 1.5,0)];
const earthAxisGeom = new THREE.BufferGeometry().setFromPoints(earthAxisPoints);
const earthAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const earthAxis = new THREE.Line(earthAxisGeom, earthAxisMat);
earthAxis.rotation.z += toRadians(earth.axialTilt);
earthGroup.add(earthAxis);

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
mercury.planetMesh = mercurySphere;
scene.add(mercuryGroup)
addHoverTarget(mercurySphere, mercury);

// mercury axis 
const mercuryAxisPoints = [new THREE.Vector3(0,mercury.size * 1.5,0), new THREE.Vector3(0,-1 * mercury.size * 1.5,0)];
const mercuryAxisGeom = new THREE.BufferGeometry().setFromPoints(mercuryAxisPoints);
const mercuryAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const mercuryAxis = new THREE.Line(mercuryAxisGeom, mercuryAxisMat);
mercuryAxis.rotation.z += toRadians(mercury.axialTilt);
mercuryGroup.add(mercuryAxis);

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
venus.planetMesh = venusSphere;
scene.add(venusGroup)
addHoverTarget(venusSphere, venus);

// venus axis 
const venusAxisPoints = [new THREE.Vector3(0,venus.size * 1.5,0), new THREE.Vector3(0,-1 * venus.size * 1.5,0)];
const venusAxisGeom = new THREE.BufferGeometry().setFromPoints(venusAxisPoints);
const venusAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const venusAxis = new THREE.Line(venusAxisGeom, venusAxisMat);
venusAxis.rotation.z += toRadians(venus.axialTilt);
venusGroup.add(venusAxis);

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
mars.planetMesh = marsSphere;
scene.add(marsGroup)
addHoverTarget(marsSphere, mars);

// mars axis 
const marsAxisPoints = [new THREE.Vector3(0,mars.size * 1.5,0), new THREE.Vector3(0,-1 * mars.size * 1.5,0)];
const marsAxisGeom = new THREE.BufferGeometry().setFromPoints(marsAxisPoints);
const marsAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const marsAxis = new THREE.Line(marsAxisGeom, marsAxisMat);
marsAxis.rotation.z += toRadians(mars.axialTilt);
marsGroup.add(marsAxis);

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
jupiter.planetMesh = jupiterSphere;
scene.add(jupiterGroup)
addHoverTarget(jupiterSphere, jupiter);

// jupiter axis 
const jupiterAxisPoints = [new THREE.Vector3(0,jupiter.size * 1.5,0), new THREE.Vector3(0,-1 * jupiter.size * 1.5,0)];
const jupiterAxisGeom = new THREE.BufferGeometry().setFromPoints(jupiterAxisPoints);
const jupiterAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const jupiterAxis = new THREE.Line(jupiterAxisGeom, jupiterAxisMat);
jupiterAxis.rotation.z += toRadians(jupiter.axialTilt);
jupiterGroup.add(jupiterAxis);

//saturn
const saturnTiltGroup = new THREE.Group();
saturnTiltGroup.rotation.z = toRadians(saturn.axialTilt);
saturnGroup.add(saturnTiltGroup);

const saturnTexture = textureLoader.load('statics/images/saturnTexture.jpg')
const saturnGeometry = new THREE.SphereGeometry(saturn.size);
const saturnMaterial = new THREE.MeshPhongMaterial({
  map: saturnTexture,
  shininess: 0.3,
});
const saturnSphere = new THREE.Mesh( saturnGeometry, saturnMaterial );
saturnGroup.add(saturnSphere);
saturnSphere.position.set(0,0,0);
saturnTiltGroup.add(saturnSphere);
saturn.planetGroup = saturnGroup;
saturn.planetMesh = saturnSphere;
scene.add(saturnGroup)
addHoverTarget(saturnSphere, saturn);

// Saturn rings
const saturnRingColor = textureLoader.load('statics/images/saturnringcolor.jpg');
const saturnRingAlpha = textureLoader.load('statics/images/saturnringpattern.gif');

saturnRingColor.colorSpace = THREE.SRGBColorSpace;

const saturnRingGeometry = new THREE.RingGeometry(
  saturn.size * 1.25,   // inner radius
  saturn.size * 2.35,   // outer radius
  256
);

// Fix UVs so the texture maps across the ring instead of stretching weirdly
const pos = saturnRingGeometry.attributes.position;
const uv = saturnRingGeometry.attributes.uv;

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);
  const radius = Math.sqrt(x * x + y * y);

  const u = (radius - saturn.size * 1.25) / (saturn.size * 2.35 - saturn.size * 1.25);
  uv.setXY(i, u, 0.5);
}

const saturnRingMaterial = new THREE.MeshPhongMaterial({
  map: saturnRingColor,
  alphaMap: saturnRingAlpha,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  shininess: 0.2,
});

const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);

saturnRing.rotation.x = Math.PI / 2;

saturnTiltGroup.add(saturnRing);
const titanSphere = createMoon(saturnGroup,titan,'statics/images/titanTexture.jpg');
const rheaSphere = createMoon(saturnGroup,rhea,'statics/images/rheaTexture.jpg');

// saturn axis 
const saturnAxisPoints = [new THREE.Vector3(0,saturn.size * 1.5,0), new THREE.Vector3(0,-1 * saturn.size * 1.5,0)];
const saturnAxisGeom = new THREE.BufferGeometry().setFromPoints(saturnAxisPoints);
const saturnAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const saturnAxis = new THREE.Line(saturnAxisGeom, saturnAxisMat);
saturnAxis.rotation.z = toRadians(saturn.axialTilt);
saturnGroup.add(saturnAxis);
//uranus
const uranusTexture = textureLoader.load('statics/images/uranusTexture.jpg')
const uranusGeometry = new THREE.SphereGeometry(uranus.size);
const uranusMaterial = new THREE.MeshPhongMaterial({
  map: uranusTexture,
  shininess: 0.3,
});
const uranusSphere = new THREE.Mesh( uranusGeometry, uranusMaterial );
uranusSphere.rotation.z += toRadians(uranus.axialTilt);
uranusSphere.position.set(0,0,0);
uranusGroup.add(uranusSphere);
uranus.planetGroup = uranusGroup;
uranus.planetMesh = uranusSphere;
scene.add(uranusGroup)
addHoverTarget(uranusSphere, uranus);

// uranus axis 
const uranusAxisPoints = [new THREE.Vector3(0,uranus.size * 1.5,0), new THREE.Vector3(0,-1 * uranus.size * 1.5,0)];
const uranusAxisGeom = new THREE.BufferGeometry().setFromPoints(uranusAxisPoints);
const uranusAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const uranusAxis = new THREE.Line(uranusAxisGeom, uranusAxisMat);
uranusAxis.rotation.z += toRadians(uranus.axialTilt);
uranusGroup.add(uranusAxis);

//neptune
const neptuneTexture = textureLoader.load('statics/images/neptuneTexture.jpg')
const neptuneGeometry = new THREE.SphereGeometry(neptune.size);
const neptuneMaterial = new THREE.MeshPhongMaterial({
  map: neptuneTexture,
  shininess: 0.3,
});
const neptuneSphere = new THREE.Mesh( neptuneGeometry, neptuneMaterial );
neptuneSphere.rotation.z += toRadians(neptune.axialTilt);
neptuneSphere.position.set(0,0,0);
neptuneGroup.add(neptuneSphere);
neptune.planetGroup = neptuneGroup;
neptune.planetMesh = neptuneSphere;
scene.add(neptuneGroup)
addHoverTarget(neptuneSphere, neptune);

// neptune axis 
const neptuneAxisPoints = [new THREE.Vector3(0,neptune.size * 1.5,0), new THREE.Vector3(0,-1 * neptune.size * 1.5,0)];
const neptuneAxisGeom = new THREE.BufferGeometry().setFromPoints(neptuneAxisPoints);
const neptuneAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const neptuneAxis = new THREE.Line(neptuneAxisGeom, neptuneAxisMat);
neptuneAxis.rotation.z += toRadians(neptune.axialTilt);
neptuneGroup.add(neptuneAxis);

//pluto
const plutoTexture = textureLoader.load('statics/images/plutoTexture.jpg')
const plutoGeometry = new THREE.SphereGeometry(pluto.size);
const plutoMaterial = new THREE.MeshPhongMaterial({
  map: plutoTexture,
  shininess: 0.3,
});
const plutoSphere = new THREE.Mesh( plutoGeometry, plutoMaterial );
plutoSphere.rotation.z += toRadians(pluto.axialTilt);
plutoSphere.position.set(0,0,0);
plutoGroup.add(plutoSphere);
pluto.planetGroup = plutoGroup;
pluto.planetMesh = plutoSphere;
scene.add(plutoGroup)
addHoverTarget(plutoSphere, pluto);

// pluto axis 
const plutoAxisPoints = [new THREE.Vector3(0,pluto.size * 1.5,0), new THREE.Vector3(0,-1 * pluto.size * 1.5,0)];
const plutoAxisGeom = new THREE.BufferGeometry().setFromPoints(plutoAxisPoints);
const plutoAxisMat = new THREE.LineBasicMaterial({color: 0x00FFFF});
const plutoAxis = new THREE.Line(plutoAxisGeom, plutoAxisMat);
plutoAxis.rotation.z += toRadians(pluto.axialTilt);
plutoGroup.add(plutoAxis);





// configuring shadowmap
renderer.shadowMap.enabled = true;
sunLight.castShadow = true;
sunLight.power = 20000;

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
saturnSphere.castShadow = true;
saturnSphere.receiveShadow = true;
uranusSphere.castShadow = true;
uranusSphere.receiveShadow = true;
neptuneSphere.castShadow = true;
neptuneSphere.receiveShadow = true;
plutoSphere.castShadow = true;
plutoSphere.receiveShadow = true;
moonSphere.castShadow = true;
moonSphere.receiveShadow = true;


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
  earthAxis.rotation.y = (time / divisor) * earth.rotationSpeed;
  mercurySphere.rotation.y = (time / divisor) * mercury.rotationSpeed;
  mercuryAxis.rotation.y = (time / divisor) * mercury.rotationSpeed;
  venusSphere.rotation.y = -(time / divisor) * venus.rotationSpeed;
  venusAxis.rotation.y = (time / divisor) * venus.rotationSpeed;
  marsSphere.rotation.y = (time / divisor) * mars.rotationSpeed;
  marsAxis.rotation.y = (time / divisor) * mars.rotationSpeed;
  jupiterSphere.rotation.y = (time / divisor) * jupiter.rotationSpeed;
  jupiterAxis.rotation.y = (time / divisor) * jupiter.rotationSpeed;
  saturnSphere.rotation.y = (time / divisor) * saturn.rotationSpeed;
  uranusSphere.rotation.y = (time / divisor) * uranus.rotationSpeed;
  uranusAxis.rotation.y = (time / divisor) * uranus.rotationSpeed;
  neptuneSphere.rotation.y = (time / divisor) * neptune.rotationSpeed;
  neptuneAxis.rotation.y = (time / divisor) * neptune.rotationSpeed;
  plutoSphere.rotation.y = (time / divisor) * pluto.rotationSpeed;
  plutoAxis.rotation.y = (time / divisor) * pluto.rotationSpeed;
  moonSphere.rotation.y = (time / divisor) * moon.rotationSpeed;
  titanSphere.rotation.y = (time / divisor) * titan.rotationSpeed;
  rheaSphere.rotation.y = (time / divisor) * rhea.rotationSpeed;
//---------------------------------------------------------------------
// Planet Orbital Rotation Update
// ---------------------------------------------------------------------

  updatePlanetRotation(earth, time);
  updateMoonRotation(moon, time);
  updatePlanetRotation(mercury, time);
  updatePlanetRotation(venus, time);
  updatePlanetRotation(mars, time);
  updatePlanetRotation(jupiter, time);
  updatePlanetRotation(saturn, time);
  updateMoonRotation(titan, time);
  updateMoonRotation(rhea, time);
  updatePlanetRotation(uranus, time);
  updatePlanetRotation(neptune, time);
  updatePlanetRotation(pluto, time);



  updateCameraMovement(deltaSeconds);
  updateHoverHighlight();
  





  renderer.render( scene, camera );
  labelRenderer.render(scene, camera)
} 
