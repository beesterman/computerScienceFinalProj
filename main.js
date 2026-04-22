import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );


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
let earth = new Planet(1.0, 1.0, 1.0, 23.5);
let jupiter = new Planet(earth.size * 11.2, earth.rotationSpeed * 0.41, earth.orbitalSpeed * 11.8, 3.0);
let saturn = new Planet(earth.size * 9.45, earth.rotationSpeed * 0.45, earth.orbitalSpeed * 11.8, 26.37);
let uranus = new Planet(earth.size * 4.0, earth.rotationSpeed * 0.71, earth.orbitalSpeed * 84, 97.77);
let neptune = new Planet(earth.size * 3.88, earth.rotationSpeed * 0.67, earth.orbitalSpeed * 165.0, 28.0);
let venus = new Planet(earth.size * 0.95, earth.rotationSpeed * 243.0, earth.orbitalSpeed * 225.0, 3.0);
let mars = new Planet(earth.size * 0.53, earth.rotationSpeed * 1.025, earth.orbitalSpeed * 687.0, 25.0);
let mercury = new Planet(earth.size * 0.38, earth.rotationSpeed * 59.0, earth.orbitalSpeed * 0.241, 2.0);
let pluto = new Planet(earth.size * 0.19, earth.rotationSpeed * 6.38, earth.orbitalSpeed * 248.0, 57.0);
let sun = new Planet(earth.size * 0.19, earth.rotationSpeed * 36.0, 0.0, 0);





// adding the various planets
// sun
const geometry = new THREE.SphereGeometry(sun.size);
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const sphere = new THREE.Mesh( geometry, material );
scene.add( sphere );



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



// this is the controlls for the mouse
const CameraControls = new OrbitControls(camera, renderer.domElement);
CameraControls.minDistance = 1;
CameraControls.maxDistance = 300;


function animate( time ) {

  sphere.rotation.x = time / 1000;
  sphere.rotation.y = time / 1000;

  renderer.render( scene, camera );

}