import { WebGLRenderer } from "three";

/**
 * Creates and configures a Three.js WebGLRenderer.
 * 
 * @returns {WebGLRenderer} A configured WebGLRenderer instance.
 */
const createRenderer = () => {
    // Initialize the WebGLRenderer.
    // - antialias: true enables anti-aliasing for smoother edges.
    // - alpha: true allows the canvas to have a transparent background.
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    
    // Set the clear alpha value to 0. This makes the background fully transparent.
    // Useful when rendering the scene over other HTML elements.
    renderer.setClearAlpha(0);

    // Return the configured renderer instance.
    return renderer;
};

export default createRenderer;
