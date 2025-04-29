import {
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
    PMREMGenerator,
    FloatType,
} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import createCamera from "./camera";
import createScene from "./scene";
import createRenderer from "./renderer";
import { Cube } from "./cube";
import Control, { MouseControl, TouchControl } from "./control";
import { setTime, setFinish } from "./statusbar";
import confetti from "canvas-confetti";

/**
 * Defines the structure for an entry in the leaderboard.
 * @typedef {object} LeaderboardEntry
 * @property {number} time - The time taken to solve the cube in seconds.
 * @property {string} date - The ISO string representation of the date when the record was set.
 * @property {string} image - The URL of the image used on the cube face for this record.
 */
type LeaderboardEntry = { time: number; date: string; image: string };

/**
 * Adjusts the camera and renderer size based on the container dimensions.
 * Ensures the aspect ratio is correct and the renderer fills the container.
 *
 * @param {Element} container - The HTML element containing the renderer's canvas.
 * @param {PerspectiveCamera} camera - The Three.js camera.
 * @param {WebGLRenderer} renderer - The Three.js renderer.
 */
const setSize = (
    container: Element,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer
) => {
    // Set the camera's aspect ratio based on the container's width and height.
    camera.aspect = container.clientWidth / container.clientHeight;
    // Update the camera's projection matrix after changing the aspect ratio.
    camera.updateProjectionMatrix();

    // Update the size of the renderer to match the container's dimensions.
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Set the pixel ratio for sharper rendering on high-DPI displays (like mobile devices).
    renderer.setPixelRatio(window.devicePixelRatio);
};

/**
 * Main class orchestrating the Rubik's Cube visualization and interaction.
 * Manages the Three.js scene, camera, renderer, cube object, controls, timer, and leaderboard logic.
 */
class Rubiks {
    /** ID for the timer interval, used to clear it later. */
    private timerId?: number;
    /** URL of the image texture applied to the cube faces. */
    private imageUrl?: string;
    /** Timestamp (in milliseconds) when the timer started. */
    private startTime?: number;
    /** The Three.js perspective camera used to view the scene. */
    private camera: PerspectiveCamera;
    /** The Three.js scene containing the cube and lighting. */
    private scene: Scene;
    /** The Cube instance representing the Rubik's Cube. Undefined until setOrder is called. */
    private cube: Cube | undefined;
    /** The Three.js WebGL renderer responsible for drawing the scene. */
    private renderer: WebGLRenderer;
    /** Array holding the active control instances (MouseControl, TouchControl). */
    private _controls: Control[] = [];

    /**
     * Initializes the Rubik's Cube application within a given container element.
     * Sets up the camera, scene, renderer, loads environment map, adds controls,
     * and sets the initial cube order.
     *
     * @param {Element} container - The HTML element where the cube will be rendered.
     */
    public constructor(container: Element) {
        // Create and configure camera, scene, and renderer.
        this.camera = createCamera();
        this.scene = createScene();
        this.renderer = createRenderer();

        // Load and apply an HDR environment map for realistic reflections (PBR).
        const pmrem = new PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        new RGBELoader()
            .setDataType(FloatType) // Use FloatType for HDR data.
            .load(
                // URL of the HDR environment map.
                "https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr",
                (hdr) => {
                    // Generate the environment map texture from the loaded HDR data.
                    const envMap = pmrem.fromEquirectangular(hdr).texture;
                    // Apply the environment map to the scene for reflections.
                    this.scene.environment = envMap;
                    // Optionally set the background (commented out).
                    // this.scene.background = envMap;
                    // Dispose of the HDR data and PMREM generator to free memory.
                    hdr.dispose();
                    pmrem.dispose();
                }
            );

        // Append the renderer's canvas element to the container.
        container.appendChild(this.renderer.domElement);

        // Add event listener to handle window resizing.
        window.addEventListener("resize", () => {
            // Adjust size of camera and renderer.
            setSize(container, this.camera, this.renderer);
            // Re-render the scene after resizing.
            this.render();
        });
        // Set initial size.
        setSize(container, this.camera, this.renderer);

        // Initialize imageUrl from localStorage if available.
        const savedImage = localStorage.getItem("rubiksImage");
        if (savedImage) this.imageUrl = savedImage;

        // Set the initial order of the cube (e.g., 3x3x3).
        this.setOrder(3);

        // Start the entrance animation.
        this.startAnimation();
        // Scramble the cube initially.
        this.disorder();
    }

    /**
     * Sets the order (size) of the Rubik's Cube.
     * Removes the old cube, creates a new one with the specified order and image,
     * adjusts the camera position, and initializes appropriate controls.
     *
     * @param {number} order - The desired order of the cube (e.g., 2 for 2x2, 3 for 3x3).
     */
    public setOrder(order: number) {
        // Remove the existing cube from the scene.
        this.scene.remove(...this.scene.children);
        // Dispose of existing controls to remove event listeners.
        if (this._controls.length > 0) {
            this._controls.forEach((control) => control.dispose());
            this._controls = []; // Clear the controls array
        }

        // Create a new Cube instance with the specified order and image URL.
        const cube = new Cube(order, this.imageUrl);
        // Add the new cube to the scene.
        this.scene.add(cube);
        this.cube = cube; // Store reference to the new cube.
        this.render(); // Render the scene with the new cube.

        // Adjust camera distance based on the new cube's apparent size on screen.
        const { clientWidth: width, clientHeight: height } =
            this.renderer.domElement;
        const coarseSize = cube.getCoarseCubeSize(this.camera, {
            w: width,
            h: height,
        });
        // Calculate ratio to ensure the cube fits well within the view.
        const ratio = Math.max(
            2.2 / (width / coarseSize), // Ratio based on width
            2.2 / (height / coarseSize) // Ratio based on height
        );
        // Apply the ratio to the camera's z-position (distance).
        this.camera.position.z *= ratio;

        // Initialize and add mouse and touch controls for the new cube.
        this._controls.push(
            new MouseControl(this.camera, this.scene, this.renderer, cube),
            new TouchControl(this.camera, this.scene, this.renderer, cube)
        );

        // Render the scene again after camera adjustment.
        this.render();
    }

    /**
     * Scrambles the cube using a series of instant random rotations.
     * Resets and starts the timer logic, waiting for the first user interaction.
     */
    public disorder() {
        if (this.cube) {
            // Apply 20 random instant rotations.
            this.cube.scrambleSmart(20);
            this.render(); // Update the view.

            // Reset timer display and finish status.
            setFinish(false);
            setTime(0);

            // Wait for the user to start rotating the cube before starting the timer.
            const waitForFirstRotation = () => {
                // Check if a rotation is currently in progress.
                if (this.cube?.state.inRotation) {
                    this.startTimer(); // Start the timer if rotation detected.
                } else {
                    // Otherwise, continue checking on the next animation frame.
                    requestAnimationFrame(waitForFirstRotation);
                }
            };
            requestAnimationFrame(waitForFirstRotation); // Start checking.
        }
    }

    /**
     * Scrambles the cube using a series of animated random rotations.
     * Resets and starts the timer logic, waiting for the first user interaction.
     */
    public disorder2() {
        if (this.cube) {
            // Apply 20 random animated rotations.
            this.cube.scrambleSmartAnimated(20);
            this.render(); // Update the view.

            // Reset timer display and finish status.
            setFinish(false);
            setTime(0);

            // Wait for the user to start rotating the cube before starting the timer.
            const waitForFirstRotation = () => {
                // Check if a rotation is currently in progress.
                if (this.cube?.state.inRotation) {
                    this.startTimer(); // Start the timer if rotation detected.
                } else {
                    // Otherwise, continue checking on the next animation frame.
                    requestAnimationFrame(waitForFirstRotation);
                }
            };
            requestAnimationFrame(waitForFirstRotation); // Start checking.
        }
    }

    /**
     * Resets the cube to its solved state.
     * Stops the timer and resets the timer display.
     */
    public restore() {
        if (this.cube) {
            // Call the cube's internal restore method.
            this.cube.restore();
            this.render(); // Update the view.

            // Stop the timer if it's running.
            if (this.timerId) clearInterval(this.timerId);
            // Reset timer display and finish status.
            setTime(0);
            setFinish(false);
        } else {
            // Log an error if the cube instance is somehow undefined.
            console.error("RESTORE_ERROR: this.cube is undefined.");
        }
    }

    /**
     * Starts the timer interval.
     * Updates the displayed time every 500ms.
     * Checks if the cube is solved on each interval. If solved, stops the timer,
     * saves the score to the leaderboard, triggers confetti, and shows a congratulatory overlay.
     */
    private startTimer() {
        // Clear any existing timer interval.
        if (this.timerId) clearInterval(this.timerId);
        // Record the start time.
        this.startTime = Date.now();
        // Set up the interval timer.
        this.timerId = window.setInterval(() => {
            // Ensure startTime is set (safety check).
            if (!this.startTime) return;
            // Calculate elapsed time in seconds.
            const elapsed = (Date.now() - this.startTime) / 1000;
            // Update the time display.
            setTime(elapsed);

            // Check if the cube is solved.
            if (this.cube?.finish) {
                // Stop the timer interval.
                clearInterval(this.timerId!);
                // Update the status display to show the finished message.
                setFinish(true);

                // --- Leaderboard Logic ---
                const leaderboardKey = "rubiksLeaderboard";
                // Retrieve existing leaderboard data from localStorage, or initialize an empty array.
                const savedBoard: LeaderboardEntry[] = JSON.parse(
                    localStorage.getItem(leaderboardKey) || "[]"
                ) as LeaderboardEntry[];
                // Get the current image URL used on the cube.
                const imageUrl = localStorage.getItem("rubiksImage") || "";
                // Add the new entry to the leaderboard data.
                savedBoard.push({
                    time: elapsed,
                    date: new Date().toISOString(), // Record the current date/time.
                    image: imageUrl,
                });
                // Sort the leaderboard by time (ascending).
                savedBoard.sort((a, b) => a.time - b.time);
                // Keep only the top 10 entries.
                const topBoard: LeaderboardEntry[] = savedBoard.slice(0, 10);
                // Save the updated top 10 leaderboard back to localStorage.
                localStorage.setItem(leaderboardKey, JSON.stringify(topBoard));

                // --- Celebration Effects ---
                // Trigger confetti animation.
                confetti({ particleCount: 500, spread: 200 });

                // Create and display a congratulatory overlay.
                const overlay = document.createElement("div");
                overlay.id = "congrats-overlay";
                // Style the overlay.
                overlay.style.cssText =
                    "position:fixed;top:0;left:0;width:100%;height:100%;" +
                    "display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;" +
                    "font-size:1.5rem;color:#fff;padding:2rem;background:rgba(0,0,0,0.5);z-index:1000;";
                // Get the final time string from the display.
                const finalTime =
                    document.getElementById("timer")?.innerText || "";
                // Set the overlay content. (Leaderboard table commented out)
                overlay.innerHTML =
                    `🎉 Congratulations! You've solved the cube! 🎉<br/>` +
                    `${finalTime}<br/>`;
                // Add the overlay to the document body.
                document.body.appendChild(overlay);

                // Automatically remove the overlay and restore the cube after 3 seconds.
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    this.restore(); // Reset the cube for the next attempt.
                }, 3000);
            }
        }, 500); // Timer interval set to 500ms.
    }

    /**
     * Renders the scene using the camera.
     * This is called whenever the view needs to be updated.
     */
    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Implements a simple entrance animation for the cube.
     * The cube moves from a distance towards its final position over 2 seconds.
     */
    private startAnimation() {
        // Define the animation function to be called by requestAnimationFrame.
        const animation = (time: number) => {
            // Convert time from milliseconds to seconds.
            time /= 1000;
            if (this.cube) {
                // Animate the cube's z-position for the first 2 seconds.
                if (time < 2) {
                    // Move from z = -10 to z = 0 linearly over 2 seconds.
                    this.cube.position.z = (-1 + time / 2) * 10;
                } else {
                    // Ensure the cube is exactly at z = 0 after 2 seconds.
                    this.cube.position.z = 0;
                }
            }
            // Render the scene in its current state.
            this.render();
            // Request the next frame of the animation.
            // Note: This creates a continuous animation loop. Consider adding a condition to stop the loop after the entrance is complete if needed.
            requestAnimationFrame(animation);
        };
        // Start the animation loop.
        requestAnimationFrame(animation);
    }

    /**
     * Updates the image texture applied to the cube faces.
     * Stores the new image URL and recreates the cube using the current order.
     *
     * @param {string} imageUrl - The URL of the new image to apply.
     */
    public setImage(imageUrl: string) {
        // Store the new image URL.
        this.imageUrl = imageUrl;
        // Recreate the cube with the current order to apply the new image.
        if (this.cube) {
            this.setOrder(this.cube.order);
        }
    }
}

export default Rubiks;
