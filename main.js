import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const textureLoader = new THREE.TextureLoader();

// this is the controlls for the mouse
const CameraControls = new OrbitControls(camera, renderer.domElement);
CameraControls.minDistance = 1;
CameraControls.maxDistance = 300;



// setting up blueprint for planets
class Planet {
    constructor(size, rotation, orbitalSpeed, axialTilt) {
        this.size = size;
        this.rotationSpeed = rotation
        this.orbitalSpeed = orbitalSpeed
        this.axialTilt = axialTilt
    }
}

// find the info used to calculate these numbers here: https://science.nasa.gov/solar-system/planets/planet-sizes-and-locations-in-our-solar-system/
let earth = new Planet(1.0, 0.05, 1.0, 23.5);
let jupiter = new Planet(earth.size * 11.2, earth.rotationSpeed * 0.41, earth.orbitalSpeed * 11.8, 3.0);
let saturn = new Planet(earth.size * 9.45, earth.rotationSpeed * 0.45, earth.orbitalSpeed * 11.8, 26.37);
let uranus = new Planet(earth.size * 4.0, earth.rotationSpeed * 0.71, earth.orbitalSpeed * 84, 97.77);
let neptune = new Planet(earth.size * 3.88, earth.rotationSpeed * 0.67, earth.orbitalSpeed * 165.0, 28.0);
let venus = new Planet(earth.size * 0.95, earth.rotationSpeed * 243.0, earth.orbitalSpeed * 225.0, 3.0);
let mars = new Planet(earth.size * 0.53, earth.rotationSpeed * 1.025, earth.orbitalSpeed * 687.0, 25.0);
let mercury = new Planet(earth.size * 0.38, earth.rotationSpeed * 59.0, earth.orbitalSpeed * 0.241, 2.0);
let pluto = new Planet(earth.size * 0.19, earth.rotationSpeed * 6.38, earth.orbitalSpeed * 248.0, 57.0);
let sun = new Planet(earth.size * 2.0, earth.rotationSpeed * 36.0, 0.0, 0);

//function to convert degrees to radians for rotation of the 
function toRadians(input) {
    return input * (Math.PI / 180)
}

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

// sun
const sunTexture = textureLoader.load('statics/images/sunTexture.jpg');
const sunGeometry = new THREE.SphereGeometry(sun.size);
const sunMaterial = new THREE.MeshBasicMaterial( { map: sunTexture } );
const sunSphere = new THREE.Mesh( sunGeometry, sunMaterial );
scene.add( sunSphere );

const sunLight = new THREE.PointLight(0xffffff, 2, 100);
sunSphere.add(sunLight);
sunSphere.rotation.z += toRadians(sun.axialTilt);

// Earth group
let earthGroup = new THREE.Group()
const earthTexture = textureLoader.load('statics/images/earthTexture.jpg')
const earthGeometry = new THREE.SphereGeometry(earth.size);
const earthMaterial = new THREE.MeshPhongMaterial({
  map: earthTexture,
  shininess: 0.3,
});
const earthSphere = new THREE.Mesh( earthGeometry, earthMaterial );
earthSphere.rotation.z += toRadians(earth.axialTilt);
earthSphere.position.set(2,2,2);
scene.add(earthSphere);
// earthGroup.add(earthGeometry);




// configuring shadowmap
renderer.shadowMap.enabled = true;
sunLight.castShadow = true;
sunLight.power = 2000;

earthSphere.castShadow = true;
earthSphere.receiveShadow = true;


// configuring camera to be in a reasonable location
camera.position.set(2.0 * sun.size, 2.0 * sun.size, 2.0 * sun.size);

function animate( time ) {

  
  sunSphere.rotation.y = (time / 1000) * sun.rotationSpeed;
  earthSphere.rotation.y = (time / 1000) * earth.rotationSpeed;

  renderer.render( scene, camera );

}