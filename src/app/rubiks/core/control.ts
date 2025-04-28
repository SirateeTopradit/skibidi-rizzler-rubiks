import {
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "three";
import { Cube } from "./cube";
import { rotateAroundWorldAxis } from "../util/transform";
import { SquareMesh } from "./square";
import { setFinish } from "./statusbar";

/**
 * Abstract base class for handling user input (mouse or touch) to interact with the Rubik's Cube.
 * It manages the state of interaction, determines the type of interaction (rotating a face or the whole cube),
 * and triggers the corresponding actions on the Cube object.
 */
abstract class Control {
    /** The Three.js renderer instance. */
    protected renderer: WebGLRenderer;
    /** The Three.js scene instance. */
    protected scene: Scene;
    /** The Rubik's Cube instance being controlled. */
    protected cube: Cube;
    /** The Three.js camera used for viewing the scene. */
    protected camera: PerspectiveCamera;
    /** The square mesh currently being interacted with (if any). */
    protected _square: SquareMesh | null = null;
    /** Flag indicating if an interaction (drag) is currently in progress. */
    private start = false;
    /** Flag indicating if the last operation's animation is still running. Prevents starting new operations during animation. */
    private lastOperateUnfinish = false;
    /** The screen position where the current interaction started. */
    private startPos: Vector2 = new Vector2();
    /** The DOM element associated with the renderer, used for event listeners. */
    protected get domElement() {
        return this.renderer.domElement;
    }
    /** Raycaster used for detecting intersections between mouse/touch and cube faces. */
    private raycaster = new Raycaster();

    /**
     * Initializes the Control instance.
     * @param {PerspectiveCamera} camera - The camera viewing the scene.
     * @param {Scene} scene - The scene containing the cube.
     * @param {WebGLRenderer} renderer - The renderer drawing the scene.
     * @param {Cube} cube - The Rubik's Cube instance.
     */
    public constructor(
        camera: PerspectiveCamera,
        scene: Scene,
        renderer: WebGLRenderer,
        cube: Cube
    ) {
        this.cube = cube;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
    }

    /**
     * Calculates the intersection point between a screen coordinate and the cube's faces.
     * Uses Raycasting to find the closest square mesh under the given screen offset.
     *
     * @param {number} offsetX - The x-coordinate on the screen (relative to the canvas).
     * @param {number} offsetY - The y-coordinate on the screen (relative to the canvas).
     * @returns {{ distance: number; square: SquareMesh } | null} The closest intersected square and its distance, or null if no intersection.
     */
    protected getIntersects(offsetX: number, offsetY: number) {
        // Convert screen coordinates (pixels) to normalized device coordinates (-1 to +1)
        const x = (offsetX / this.domElement.clientWidth) * 2 - 1;
        const y = -(offsetY / this.domElement.clientHeight) * 2 + 1;

        // Update the raycaster with the camera and mouse position
        this.raycaster.setFromCamera(new Vector2(x, y), this.camera);

        // Array to store intersections with squares
        const intersectSquares: { distance: number; square: SquareMesh }[] = [];

        // Check intersections with all squares of the cube
        for (let i = 0; i < this.cube.squares.length; i++) {
            const intersects = this.raycaster.intersectObjects([
                this.cube.squares[i],
            ]);
            // If intersection found, add it to the list with its distance
            if (intersects.length > 0) {
                intersectSquares.push({
                    distance: intersects[0].distance,
                    square: this.cube.squares[i],
                });
            }
        }

        // Sort intersections by distance (closest first)
        intersectSquares.sort(
            (item1, item2) => item1.distance - item2.distance
        );

        // Return the closest intersection, or null if none
        return intersectSquares.length > 0 ? intersectSquares[0] : null;
    }

    /**
     * Abstract method to be implemented by subclasses for cleaning up resources (e.g., removing event listeners).
     */
    public abstract dispose(): void;

    /**
     * Handles the start of a user interaction (mouse down or touch start).
     * Records the starting position and identifies the interacted square (if any).
     *
     * @param {number} offsetX - The x-coordinate of the interaction start.
     * @param {number} offsetY - The y-coordinate of the interaction start.
     */
    protected operateStart(offsetX: number, offsetY: number) {
        // Prevent starting a new operation if one is already in progress or animating
        if (this.start || this.lastOperateUnfinish) return;

        this.start = true; // Mark interaction as started
        this.startPos = new Vector2(); // Reset start position

        // Find the square intersected at the start position
        const intersect = this.getIntersects(offsetX, offsetY);
        this._square = null; // Reset the currently interacted square

        if (intersect) {
            // If a square is intersected, store it and the start position
            this._square = intersect.square;
            this.startPos = new Vector2(offsetX, offsetY);
        }
    }

    /**
     * Handles the dragging motion during a user interaction (mouse move or touch move).
     * Calculates the rotation angle and axis based on the drag movement.
     * If a square was initially clicked, rotates the corresponding plane.
     * Otherwise, rotates the entire cube.
     *
     * @param {number} offsetX - The current x-coordinate of the interaction.
     * @param {number} offsetY - The current y-coordinate of the interaction.
     * @param {number} movementX - The change in x-coordinate since the last move event.
     * @param {number} movementY - The change in y-coordinate since the last move event.
     */
    protected operateDrag(
        offsetX: number,
        offsetY: number,
        movementX: number,
        movementY: number
    ) {
        // Only process drag if an interaction has started and no animation is pending
        if (this.start && !this.lastOperateUnfinish) {
            if (this._square) {
                // --- Rotate a single plane ---
                const curMousePos = new Vector2(offsetX, offsetY);
                // Delegate plane rotation logic to the Cube class
                this.cube.rotateOnePlane(
                    this.startPos,
                    curMousePos,
                    this._square,
                    this.camera,
                    {
                        w: this.domElement.clientWidth,
                        h: this.domElement.clientHeight,
                    }
                );
            } else {
                // --- Rotate the whole cube ---
                const dx = movementX; // Horizontal movement
                const dy = -movementY; // Vertical movement (inverted Y-axis in screen coordinates)
                const movementLen = Math.sqrt(dx * dx + dy * dy); // Magnitude of the movement vector

                // Estimate the cube's size on screen to scale rotation speed
                const cubeSize = this.cube.getCoarseCubeSize(this.camera, {
                    w: this.domElement.clientWidth,
                    h: this.domElement.clientHeight,
                });

                // Calculate rotation angle based on movement length relative to cube size
                const rotateAngle = (Math.PI * movementLen) / cubeSize;

                // Determine the rotation axis (perpendicular to the movement direction)
                const moveVect = new Vector2(dx, dy);
                const rotateDir = moveVect.rotateAround(
                    new Vector2(0, 0),
                    Math.PI * 0.5 // Rotate movement vector by 90 degrees
                );

                // Apply the rotation to the entire cube around the calculated world axis
                rotateAroundWorldAxis(
                    this.cube,
                    new Vector3(rotateDir.x, rotateDir.y, 0),
                    rotateAngle
                );
            }
            // Re-render the scene to show the rotation
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Handles the end of a user interaction (mouse up or touch end).
     * If a plane was being rotated, triggers the snapping animation to the nearest 90-degree position.
     * Resets interaction state.
     */
    protected operateEnd() {
        // Only process if no animation is currently running
        if (!this.lastOperateUnfinish) {
            if (this._square) {
                // If a square was being dragged (meaning a plane rotation)
                const rotateAnimation = this.cube.getAfterRotateAnimation(); // Get the animation function from the cube
                this.lastOperateUnfinish = true; // Set flag to indicate animation is starting

                // Animation loop using requestAnimationFrame
                const animation = (time: number) => {
                    const next = rotateAnimation(time); // Execute one step of the animation
                    this.renderer.render(this.scene, this.camera); // Render the updated state
                    if (next) {
                        // If the animation is not finished, request the next frame
                        requestAnimationFrame(animation);
                    } else {
                        // Animation finished
                        setFinish(this.cube.finish); // Update the status bar (e.g., check if solved)
                        this.lastOperateUnfinish = false; // Clear the animation flag
                    }
                };
                requestAnimationFrame(animation); // Start the animation loop
            }
            // Reset interaction state regardless of whether an animation started
            this.start = false;
            this._square = null;
        }
    }
}

/**
 * Implements user control for the Rubik's Cube using mouse input.
 * Extends the base Control class and adds specific mouse event listeners.
 */
export class MouseControl extends Control {
    /**
     * Initializes MouseControl, binding event handlers and adding listeners.
     * @param {PerspectiveCamera} camera - The camera viewing the scene.
     * @param {Scene} scene - The scene containing the cube.
     * @param {WebGLRenderer} renderer - The renderer drawing the scene.
     * @param {Cube} cube - The Rubik's Cube instance.
     */
    constructor(
        camera: PerspectiveCamera,
        scene: Scene,
        renderer: WebGLRenderer,
        cube: Cube
    ) {
        super(camera, scene, renderer, cube);
        // Bind event handlers to 'this' context to ensure correct scope when called by listeners
        this.mousedownHandle = this.mousedownHandle.bind(this);
        this.mouseupHandle = this.mouseupHandle.bind(this);
        this.mousemoveHandle = this.mousemoveHandle.bind(this);
        this.mouseoutHandle = this.mouseoutHandle.bind(this);
        this.init(); // Add event listeners
    }

    /** Handles the mouse down event. */
    public mousedownHandle(event: MouseEvent) {
        event.preventDefault(); // Prevent default browser actions (e.g., text selection)
        this.operateStart(event.offsetX, event.offsetY); // Call base class start handler
    }

    /** Handles the mouse up event. */
    public mouseupHandle(event: MouseEvent) {
        event.preventDefault();
        this.operateEnd(); // Call base class end handler
    }

    /** Handles the mouse out event (when mouse leaves the canvas). */
    public mouseoutHandle(event: MouseEvent) {
        event.preventDefault();
        this.operateEnd(); // Treat mouse out like mouse up to finish any ongoing operation
    }

    /** Handles the mouse move event. */
    public mousemoveHandle(event: MouseEvent) {
        event.preventDefault();
        // Call base class drag handler with current position and movement delta
        this.operateDrag(
            event.offsetX,
            event.offsetY,
            event.movementX,
            event.movementY
        );
    }

    /** Adds mouse event listeners to the renderer's DOM element. */
    public init(): void {
        this.domElement.addEventListener("mousedown", this.mousedownHandle);
        this.domElement.addEventListener("mouseup", this.mouseupHandle);
        this.domElement.addEventListener("mousemove", this.mousemoveHandle);
        this.domElement.addEventListener("mouseout", this.mouseoutHandle);
    }

    /** Removes mouse event listeners. */
    public dispose(): void {
        this.domElement.removeEventListener("mousedown", this.mousedownHandle);
        this.domElement.removeEventListener("mouseup", this.mouseupHandle);
        this.domElement.removeEventListener("mousemove", this.mousemoveHandle);
        this.domElement.removeEventListener("mouseout", this.mouseoutHandle);
    }
}

/**
 * Implements user control for the Rubik's Cube using touch input.
 * Extends the base Control class and adds specific touch event listeners.
 */
export class TouchControl extends Control {
    /** Stores the position of the last touch event for calculating movement delta. */
    private lastPos: Vector2 | undefined;

    /**
     * Initializes TouchControl, binding event handlers and adding listeners.
     * @param {PerspectiveCamera} camera - The camera viewing the scene.
     * @param {Scene} scene - The scene containing the cube.
     * @param {WebGLRenderer} renderer - The renderer drawing the scene.
     * @param {Cube} cube - The Rubik's Cube instance.
     */
    constructor(
        camera: PerspectiveCamera,
        scene: Scene,
        renderer: WebGLRenderer,
        cube: Cube
    ) {
        super(camera, scene, renderer, cube);
        // Bind event handlers
        this.touchStart = this.touchStart.bind(this);
        this.touchMove = this.touchMove.bind(this);
        this.touchEnd = this.touchEnd.bind(this);
        this.init(); // Add listeners
    }

    /** Handles the touch start event. */
    public touchStart(event: TouchEvent) {
        event.preventDefault(); // Prevent default browser actions (e.g., scrolling)
        const touches = event.touches;
        // Handle single touch events
        if (touches.length === 1) {
            const touch = touches[0];
            // Record the starting touch position
            this.lastPos = new Vector2(touch.pageX, touch.pageY);
            // Call base class start handler
            this.operateStart(touch.pageX, touch.pageY);
        }
    }

    /** Handles the touch move event. */
    public touchMove(event: TouchEvent) {
        event.preventDefault();
        const touches = event.touches;
        // Handle single touch movement
        if (touches.length === 1 && this.lastPos) {
            const touch = touches[0];
            // Call base class drag handler with current position and calculated movement delta
            this.operateDrag(
                touch.pageX,
                touch.pageY,
                touch.pageX - this.lastPos.x, // Calculate movementX
                touch.pageY - this.lastPos.y // Calculate movementY
            );
            // Update the last known position for the next move event
            this.lastPos = new Vector2(touch.pageX, touch.pageY);
        }
    }

    /** Handles the touch end event. */
    public touchEnd(event: TouchEvent) {
        event.preventDefault();
        this.lastPos = undefined; // Clear the last position
        this.operateEnd(); // Call base class end handler
    }

    /** Adds touch event listeners to the renderer's DOM element. */
    public init(): void {
        // Use passive: false if preventDefault is called inside the handler
        this.domElement.addEventListener("touchstart", this.touchStart, {
            passive: false,
        });
        this.domElement.addEventListener("touchmove", this.touchMove, {
            passive: false,
        });
        this.domElement.addEventListener("touchend", this.touchEnd, {
            passive: false,
        });
    }

    /** Removes touch event listeners. */
    public dispose(): void {
        this.domElement.removeEventListener("touchstart", this.touchStart);
        this.domElement.removeEventListener("touchmove", this.touchMove);
        this.domElement.removeEventListener("touchend", this.touchEnd);
    }
}

export default Control;
