import { PerspectiveCamera } from "three";

/**
 * Creates and configures a Three.js PerspectiveCamera.
 * 
 * @returns {PerspectiveCamera} A configured PerspectiveCamera instance.
 */
const createCamera = () => {
    // Initialize a PerspectiveCamera with a 45-degree field of view,
    // an aspect ratio of 1 (placeholder, usually updated on resize),
    // a near clipping plane of 0.1, and a far clipping plane of 100.
    const camera = new PerspectiveCamera(45, 1, 0.1, 100);

    // Set the initial position of the camera along the z-axis.
    camera.position.set(0, 0, 15);

    // Return the configured camera instance.
    return camera;
};

export default createCamera;
