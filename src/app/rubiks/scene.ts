import { Scene, HemisphereLight, DirectionalLight } from "three";

/**
 * Creates and configures a basic Three.js Scene with lighting.
 *
 * @returns {Scene} A configured Scene instance with hemisphere and directional lights.
 */
const createScene = () => {
    // Initialize a new Three.js Scene.
    const scene = new Scene();

    // Create a HemisphereLight to provide ambient light from above and below.
    // - Sky color: 0xffffff (white)
    // - Ground color: 0x444444 (dark gray)
    // - Intensity: 0.6
    const hemi = new HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemi); // Add the hemisphere light to the scene.

    // Create a DirectionalLight to simulate sunlight.
    // - Color: 0xffffff (white)
    // - Intensity: 0.8
    const dir = new DirectionalLight(0xffffff, 0.8);
    // Set the position of the directional light source.
    dir.position.set(5, 10, 7.5);
    scene.add(dir); // Add the directional light to the scene.

    // Return the configured scene instance.
    return scene;
};

export default createScene;
