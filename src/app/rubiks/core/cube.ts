import { Camera, Color, Group, Matrix4, Vector2, Vector3 } from "three";
import { setFinish } from "./statusbar";
import { getAngleBetweenTwoVector2, equalDirection } from "../util/math";
import { ndcToScreen } from "../util/transform";
import CubeData from "./cubeData";
import CubeState, { RotateDirection } from "./cubeState";
import { createSquare, SquareMesh } from "./square";

/**
 * Calculates a temporary position slightly offset from the square's center along its normal.
 * This is used to determine which plane a square belongs to for rotation.
 * @param {SquareMesh} square - The square mesh.
 * @param {number} squareSize - The size of one square element.
 * @returns {Vector3} The calculated temporary position.
 */
const getTemPos = (square: SquareMesh, squareSize: number) => {
    // Calculate the offset vector (half the square size along the negative normal)
    const moveVect = square.element.normal
        .clone()
        .normalize()
        .multiplyScalar(-0.5 * squareSize);
    // Get the square's current position
    const pos = square.element.pos.clone();

    // Return the position offset by the calculated vector
    return pos.add(moveVect);
};

/**
 * Represents the Rubik's Cube as a 3D object in the scene.
 * Extends Three.js Group to hold all the individual square meshes.
 * Manages the cube's data (colors, positions), state (rotation, solved status),
 * and handles user interactions for rotating planes or the entire cube.
 */
export class Cube extends Group {
    /** Optional URL for the image texture applied to the cube faces. */
    private imageUrl?: string;
    /** Manages the underlying data structure (colors, positions) of the cube elements. */
    private data: CubeData;
    /** Manages the current state of the cube, including rotation status and solved validation. */
    public state!: CubeState;
    /**
     * Gets all the SquareMesh objects that make up the cube.
     * @returns {SquareMesh[]} An array of square meshes.
     */
    public get squares() {
        return this.children as SquareMesh[];
    }

    /**
     * Gets the order (size) of the cube (e.g., 3 for a 3x3x3 cube).
     * @returns {number} The order of the cube.
     */
    public get order() {
        return this.data.cubeOrder;
    }

    /**
     * Gets the size of a single square element on the cube face.
     * @returns {number} The size of a square.
     */
    public get squareSize() {
        return this.data.elementSize;
    }

    /**
     * Checks if the cube is currently in a solved state.
     * @returns {boolean} True if the cube is solved, false otherwise.
     */
    public get finish() {
        return this.state.validateFinish();
    }

    /**
     * Creates a new Cube instance.
     * @param {number} [order=3] - The order of the cube (e.g., 3 for 3x3x3).
     * @param {string} [imageUrl] - Optional URL for an image texture to apply to faces.
     */
    public constructor(order = 3, imageUrl?: string) {
        super();

        this.imageUrl = imageUrl;
        this.data = new CubeData(order); // Initialize cube data structure

        this.createChildrenByData(); // Create the visual square meshes

        // Initial rotation for better viewing angle
        this.rotateX(Math.PI * 0.25);
        this.rotateY(Math.PI * 0.25);
        setFinish(this.finish); // Update the status bar initially
    }

    /**
     * Creates and adds the individual square meshes to the Cube group based on the CubeData.
     * Also initializes the CubeState.
     */
    private createChildrenByData() {
        this.remove(...this.children); // Clear existing squares if any

        // Create a SquareMesh for each element defined in CubeData
        for (let i = 0; i < this.data.elements.length; i++) {
            const square = createSquare(
                new Color(this.data.elements[i].color),
                this.data.elements[i],
                this.imageUrl
            );
            this.add(square);
        }

        // Initialize the state manager with the newly created squares
        this.state = new CubeState(this.squares);
    }

    /**
     * Handles the rotation of a single plane based on user drag input.
     * Determines the rotation axis and angle from the mouse movement relative to the clicked square.
     *
     * @param {Vector2} mousePrePos - The mouse position where the drag started.
     * @param {Vector2} mouseCurPos - The current mouse position during the drag.
     * @param {SquareMesh} controlSquare - The specific square that was initially clicked.
     * @param {Camera} camera - The scene camera for projecting 3D points to 2D screen coordinates.
     * @param {{ w: number; h: number }} winSize - The dimensions of the renderer canvas.
     */
    public rotateOnePlane(
        mousePrePos: Vector2,
        mouseCurPos: Vector2,
        controlSquare: SquareMesh,
        camera: Camera,
        winSize: { w: number; h: number }
    ) {
        // Ignore minor movements to prevent accidental rotations
        if (mouseCurPos.distanceTo(mousePrePos) < 5) {
            return;
        }

        // Ensure the control square is part of this cube
        if (!this.squares.includes(controlSquare)) {
            return;
        }

        // Calculate the direction of the mouse movement on the screen
        const screenDir = mouseCurPos.clone().sub(mousePrePos);
        if (screenDir.x === 0 && screenDir.y === 0) return; // No movement

        // --- Determine Rotation Axis and Direction (only if not already rotating) ---
        if (!this.state.inRotation) {
            // Get the screen position of the control square
            const squareScreenPos = this.getSquareScreenPos(
                controlSquare,
                camera,
                winSize
            ) as Vector2;

            // Get the normal and position of the control square in world space
            const squareNormal = controlSquare.element.normal;
            const squarePos = controlSquare.element.pos;

            // Find adjacent squares on the same face to determine potential rotation axes
            const commonDirSquares = this.squares.filter(
                (square) =>
                    square.element.normal.equals(squareNormal) && // Same normal (face)
                    !square.element.pos.equals(squarePos) // Different position
            );

            // Find two adjacent squares (one along each potential axis on the face)
            let square1: SquareMesh | undefined; // Adjacent square along one axis
            let square2: SquareMesh | undefined; // Adjacent square along the other axis
            for (let i = 0; i < commonDirSquares.length; i++) {
                // Logic to find squares sharing only one coordinate (meaning they are adjacent along an axis)
                if (squareNormal.x !== 0) {
                    // Face pointing along X
                    if (commonDirSquares[i].element.pos.y === squarePos.y)
                        square1 = commonDirSquares[i]; // Adjacent along Z
                    if (commonDirSquares[i].element.pos.z === squarePos.z)
                        square2 = commonDirSquares[i]; // Adjacent along Y
                } else if (squareNormal.y !== 0) {
                    // Face pointing along Y
                    if (commonDirSquares[i].element.pos.x === squarePos.x)
                        square1 = commonDirSquares[i]; // Adjacent along Z
                    if (commonDirSquares[i].element.pos.z === squarePos.z)
                        square2 = commonDirSquares[i]; // Adjacent along X
                } else if (squareNormal.z !== 0) {
                    // Face pointing along Z
                    if (commonDirSquares[i].element.pos.x === squarePos.x)
                        square1 = commonDirSquares[i]; // Adjacent along Y
                    if (commonDirSquares[i].element.pos.y === squarePos.y)
                        square2 = commonDirSquares[i]; // Adjacent along X
                }

                if (square1 && square2) break; // Found both adjacent squares
            }

            // If we couldn't find two adjacent squares (shouldn't happen for a valid cube), exit
            if (!square1 || !square2) {
                return;
            }

            // Get screen positions of the adjacent squares
            const square1ScreenPos = this.getSquareScreenPos(
                square1,
                camera,
                winSize
            ) as Vector2;
            const square2ScreenPos = this.getSquareScreenPos(
                square2,
                camera,
                winSize
            ) as Vector2;

            // Define potential rotation directions based on screen vectors from control square to adjacent squares
            const squareDirs: RotateDirection[] = [];
            const squareDir1 = {
                screenDir: new Vector2(
                    square1ScreenPos.x - squareScreenPos.x,
                    square1ScreenPos.y - squareScreenPos.y
                ).normalize(),
                startSquare: controlSquare,
                endSquare: square1,
            };
            const squareDir2 = {
                screenDir: new Vector2(
                    square2ScreenPos.x - squareScreenPos.x,
                    square2ScreenPos.y - squareScreenPos.y
                ).normalize(),
                startSquare: controlSquare,
                endSquare: square2,
            };
            // Add directions and their opposites
            squareDirs.push(squareDir1);
            squareDirs.push({
                screenDir: squareDir1.screenDir.clone().negate(),
                startSquare: square1,
                endSquare: controlSquare,
            });
            squareDirs.push(squareDir2);
            squareDirs.push({
                screenDir: squareDir2.screenDir.clone().negate(),
                startSquare: square2,
                endSquare: controlSquare,
            });

            // Find the potential rotation direction that most closely matches the user's drag direction
            let minAngle = Math.abs(
                getAngleBetweenTwoVector2(squareDirs[0].screenDir, screenDir)
            );
            let rotateDir = squareDirs[0]; // The determined rotation direction
            for (let i = 0; i < squareDirs.length; i++) {
                const angle = Math.abs(
                    getAngleBetweenTwoVector2(
                        squareDirs[i].screenDir,
                        screenDir
                    )
                );
                if (minAngle > angle) {
                    minAngle = angle;
                    rotateDir = squareDirs[i];
                }
            }

            // Calculate the rotation axis in local coordinates (cross product of face normal and rotation direction vector)
            const rotateDirLocal = rotateDir.endSquare.element.pos
                .clone()
                .sub(rotateDir.startSquare.element.pos)
                .normalize();
            const rotateAxisLocal = squareNormal
                .clone()
                .cross(rotateDirLocal)
                .normalize(); // The axis around which the plane will rotate

            // Identify all squares belonging to the plane that needs to rotate
            const rotateSquares: SquareMesh[] = [];
            const controlTemPos = getTemPos(
                controlSquare,
                this.data.elementSize
            ); // Use temp position for robust plane identification
            for (let i = 0; i < this.squares.length; i++) {
                const squareTemPos = getTemPos(
                    this.squares[i],
                    this.data.elementSize
                );
                const squareVec = controlTemPos.clone().sub(squareTemPos);
                // Squares whose vector to the control square is perpendicular to the rotation axis are on the same plane
                if (squareVec.dot(rotateAxisLocal) === 0) {
                    rotateSquares.push(this.squares[i]);
                }
            }

            // Set the rotation state in the CubeState manager
            this.state.setRotating(
                controlSquare,
                rotateSquares,
                rotateDir,
                rotateAxisLocal
            );
        }

        // --- Apply Rotation Based on Drag ---
        const rotateSquares = this.state.activeSquares; // Squares currently being rotated
        const rotateAxisLocal = this.state.rotateAxisLocal; // Axis of rotation

        // Calculate the angle of rotation based on the drag distance projected onto the rotation direction
        const temAngle = getAngleBetweenTwoVector2(
            this.state.rotateDirection!.screenDir,
            screenDir
        );
        const screenDirProjectRotateDirLen =
            Math.cos(temAngle) * screenDir.length(); // Projected length
        const coarseCubeSize = this.getCoarseCubeSize(camera, winSize); // Estimated size on screen for scaling
        const rotateAnglePI =
            (screenDirProjectRotateDirLen / coarseCubeSize) * Math.PI * 0.5; // Rotation angle in radians (scaled)

        // Calculate the incremental rotation angle since the last frame
        const newRotateAnglePI = rotateAnglePI - this.state.rotateAnglePI;
        this.state.rotateAnglePI = rotateAnglePI; // Update total rotation angle in state

        // Create the rotation matrix for the incremental angle
        const rotateMat = new Matrix4();
        rotateMat.makeRotationAxis(rotateAxisLocal!, newRotateAnglePI);

        // Apply the rotation matrix to all squares in the active plane
        for (let i = 0; i < rotateSquares.length; i++) {
            rotateSquares[i].applyMatrix4(rotateMat);
            rotateSquares[i].updateMatrix(); // Update the square's matrix for rendering
        }
    }

    /**
     * Returns an animation function that snaps the currently rotating plane to the nearest 90-degree position.
     * This is called when the user releases the mouse/touch after dragging a plane.
     *
     * @returns {(tick: number) => boolean} An animation function. It takes the current time (tick)
     *          and returns true if the animation should continue, false if it's finished.
     */
    public getAfterRotateAnimation() {
        // Calculate the remaining angle needed to reach the nearest 90-degree snap position
        const needRotateAnglePI = this.getNeededRotateAngle();
        // Define rotation speed (radians per millisecond)
        const rotateSpeed = (Math.PI * 0.5) / 500; // 90 degrees in 500ms
        let rotatedAngle = 0; // Track how much has been rotated in this animation
        let lastTick: number; // Timestamp of the last frame

        // The animation function passed to requestAnimationFrame
        const rotateTick = (tick: number): boolean => {
            if (!lastTick) lastTick = tick; // Initialize lastTick on first frame
            const time = tick - lastTick; // Time elapsed since last frame
            lastTick = tick;

            // Continue animation as long as the rotated angle is less than the needed angle
            if (rotatedAngle < Math.abs(needRotateAnglePI)) {
                // Calculate rotation for this frame, ensuring not to overshoot
                let curAngle = time * rotateSpeed;
                if (rotatedAngle + curAngle > Math.abs(needRotateAnglePI)) {
                    curAngle = Math.abs(needRotateAnglePI) - rotatedAngle;
                }
                rotatedAngle += curAngle;
                // Apply sign based on the direction of the needed rotation
                curAngle = needRotateAnglePI > 0 ? curAngle : -curAngle;

                // Create rotation matrix for this frame's angle
                const rotateMat = new Matrix4();
                rotateMat.makeRotationAxis(
                    this.state.rotateAxisLocal!,
                    curAngle
                );

                // Apply rotation to all active squares
                for (let i = 0; i < this.state.activeSquares.length; i++) {
                    this.state.activeSquares[i].applyMatrix4(rotateMat);
                    this.state.activeSquares[i].updateMatrix();
                }
                return true; // Animation continues
            } else {
                // Animation finished
                this.updateStateAfterRotate(); // Finalize the state update (positions, normals)
                this.data.saveDataToLocal(); // Persist the new cube state
                return false; // Animation stops
            }
        };

        return rotateTick;
    }

    /**
     * Updates the internal state (positions and normals) of the squares involved in the last rotation.
     * This is called after the snapping animation completes to ensure data consistency.
     */
    private updateStateAfterRotate() {
        // Calculate the total rotation applied, including the final snap
        const needRotateAnglePI = this.getNeededRotateAngle();
        this.state.rotateAnglePI += needRotateAnglePI;

        // Calculate the effective rotation angle modulo 360 degrees (2 * PI)
        const angleRelative360PI = this.state.rotateAnglePI % (Math.PI * 2);

        // If there was a significant net rotation (more than a small tolerance)
        if (Math.abs(angleRelative360PI) > 0.1) {
            // Create a matrix for the total effective rotation
            const rotateMat2 = new Matrix4();
            rotateMat2.makeRotationAxis(
                this.state.rotateAxisLocal!,
                angleRelative360PI
            );

            // Store the target normal and position for each rotated square
            const pn: { nor: Vector3; pos: Vector3 }[] = [];

            // Calculate the final theoretical position and normal for each active square
            for (let i = 0; i < this.state.activeSquares.length; i++) {
                const nor = this.state.activeSquares[i].element.normal.clone();
                const pos = this.state.activeSquares[i].element.pos.clone();

                // Apply the total rotation matrix
                nor.applyMatrix4(rotateMat2);
                pos.applyMatrix4(rotateMat2);

                // Find the original square data that corresponds to this new position/normal
                // This maps the rotated square back to its logical position in the CubeData
                for (let j = 0; j < this.state.activeSquares.length; j++) {
                    const nor2 =
                        this.state.activeSquares[j].element.normal.clone();
                    const pos2 =
                        this.state.activeSquares[j].element.pos.clone();
                    // Check for equality using direction and distance (within tolerance)
                    if (
                        equalDirection(nor, nor2) &&
                        pos.distanceTo(pos2) < 0.1
                    ) {
                        pn.push({ nor: nor2, pos: pos2 });
                    }
                }
            }

            // Update the element data (normal and position) for each active square
            for (let i = 0; i < this.state.activeSquares.length; i++) {
                this.state.activeSquares[i].element.normal = pn[i].nor;
                this.state.activeSquares[i].element.pos = pn[i].pos;
            }
        }

        // Reset the rotation state in the CubeState manager
        this.state.resetState();
    }

    /**
     * Calculates the shortest angle (positive or negative) required to snap the current rotation angle
     * to the nearest multiple of 90 degrees (PI / 2 radians).
     *
     * @returns {number} The angle in radians needed to reach the snap position.
     */
    private getNeededRotateAngle() {
        const rightAnglePI = Math.PI * 0.5; // 90 degrees in radians
        // Calculate the remainder when dividing the current angle by 90 degrees
        const exceedAnglePI = Math.abs(this.state.rotateAnglePI) % rightAnglePI;
        // Determine the needed angle: if past halfway, rotate forward; otherwise, rotate back.
        let needRotateAnglePI =
            exceedAnglePI > rightAnglePI * 0.5
                ? rightAnglePI - exceedAnglePI // Rotate forward to the next 90 degrees
                : -exceedAnglePI; // Rotate backward to the previous 90 degrees
        // Ensure the sign matches the original rotation direction
        needRotateAnglePI =
            this.state.rotateAnglePI > 0
                ? needRotateAnglePI
                : -needRotateAnglePI;

        return needRotateAnglePI;
    }

    /**
     * Estimates the apparent size of the cube on the screen in pixels.
     * Projects two points on opposite sides of the cube to screen space and calculates the distance.
     *
     * @param {Camera} camera - The scene camera.
     * @param {{ w: number; h: number }} winSize - The dimensions of the renderer canvas.
     * @returns {number} The estimated size of the cube in pixels.
     */
    public getCoarseCubeSize(
        camera: Camera,
        winSize: { w: number; h: number }
    ) {
        const width = this.order * this.squareSize; // Total width of the cube
        // Define two points on opposite sides (e.g., left and right center)
        const p1 = new Vector3(-width / 2, 0, 0);
        const p2 = new Vector3(width / 2, 0, 0);

        // Project these points from world space to normalized device coordinates (NDC)
        p1.project(camera);
        p2.project(camera);

        // Convert NDC to screen coordinates (pixels)
        const { w, h } = winSize;
        const screenP1 = ndcToScreen(p1, w, h);
        const screenP2 = ndcToScreen(p2, w, h);

        // Return the distance between the screen points (approximates the cube's screen width)
        return Math.abs(screenP2.x - screenP1.x);
    }

    /**
     * Calculates the screen position (in pixels) of a given square's center.
     *
     * @param {SquareMesh} square - The square mesh.
     * @param {Camera} camera - The scene camera.
     * @param {{ w: number; h: number }} winSize - The dimensions of the renderer canvas.
     * @returns {Vector2 | null} The screen position (x, y) or null if the square is not part of the cube.
     */
    private getSquareScreenPos(
        square: SquareMesh,
        camera: Camera,
        winSize: { w: number; h: number }
    ) {
        // Ensure the square belongs to this cube instance
        if (!this.squares.includes(square)) {
            return null;
        }

        // Get the world matrix of the square (combining its local matrix and the cube's matrix)
        const mat = new Matrix4()
            .multiply(square.matrixWorld) // Square's world matrix
            .multiply(this.matrix); // Cube's world matrix (if the cube itself is transformed)

        // Get the position from the matrix and project it
        const pos = new Vector3().setFromMatrixPosition(mat); // Use setFromMatrixPosition for clarity
        pos.project(camera); // Project to NDC

        // Convert NDC to screen coordinates
        const { w, h } = winSize;
        return ndcToScreen(pos, w, h);
    }

    /**
     * Randomly shuffles the colors of the cube squares.
     * This provides a basic way to disorder the cube without simulating rotations.
     */
    public disorder() {
        // Get current colors
        const colors = this.data.elements.map((e) => e.color);
        // Fisher-Yates shuffle algorithm
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        // Assign shuffled colors back to data elements
        this.data.elements.forEach((e, idx) => {
            e.color = colors[idx];
        });
        // Recreate visual squares with new colors
        this.createChildrenByData();
        setFinish(this.finish); // Update status bar
    }

    /**
     * Resets the cube to its initial solved state.
     * Stops any ongoing rotation animations.
     */
    public restore() {
        // Stop any currently running animation
        if (this.rotateAnimationId !== null) {
            cancelAnimationFrame(this.rotateAnimationId);
            this.rotateAnimationId = null;
        }
        // Reset the underlying data to the solved state
        this.data.initialFinishData();
        this.data.saveDataToLocal(); // Persist the solved state
        // Recreate the visual squares
        this.createChildrenByData();
        setFinish(this.finish); // Update status bar
    }

    /** Stores the ID returned by requestAnimationFrame for the plane rotation animation. */
    private rotateAnimationId: number | null = null;

    /**
     * Rotates a specific plane of the cube by a given angle (multiple of 90 degrees) with animation.
     *
     * @param {SquareMesh} controlSquare - A square on the plane to be rotated.
     * @param {Vector3} axis - The axis of rotation in world space.
     * @param {number} angle90 - The rotation angle in multiples of 90 degrees (e.g., 1 for 90, -1 for -90, 2 for 180).
     * @param {() => void} [onComplete] - Optional callback function executed when the animation finishes.
     */
    public rotatePlane(
        controlSquare: SquareMesh,
        axis: Vector3,
        angle90: number,
        onComplete?: () => void
    ) {
        // Cancel any existing rotation animation
        if (this.rotateAnimationId !== null) {
            cancelAnimationFrame(this.rotateAnimationId);
            this.rotateAnimationId = null;
        }

        // Identify all squares belonging to the plane defined by the control square and axis
        const rotateSquares: SquareMesh[] = [];
        const controlTemPos = getTemPos(controlSquare, this.data.elementSize);
        for (let i = 0; i < this.squares.length; i++) {
            const squareTemPos = getTemPos(
                this.squares[i],
                this.data.elementSize
            );
            const squareVec = controlTemPos.clone().sub(squareTemPos);
            // Squares whose vector to the control square is perpendicular to the rotation axis are on the same plane
            if (squareVec.dot(axis) === 0) {
                rotateSquares.push(this.squares[i]);
            }
        }

        // Calculate total rotation angle and per-frame rotation speed
        const totalRotationAngle = angle90 * (Math.PI * 0.5);
        const numFrames = 30; // Duration of the animation in frames
        const rotateSpeed = totalRotationAngle / numFrames; // Angle per frame

        let rotatedAngle = 0; // Track accumulated rotation

        // Animation loop function
        const rotateTick = () => {
            // Calculate rotation for this frame, clamping to the total angle
            let curRotate = rotateSpeed;
            if (
                Math.abs(rotatedAngle + rotateSpeed) >
                Math.abs(totalRotationAngle)
            ) {
                curRotate = totalRotationAngle - rotatedAngle;
            }

            // Create rotation matrix for this frame
            const rotateMatCurrent = new Matrix4();
            rotateMatCurrent.makeRotationAxis(
                axis.clone().normalize(),
                curRotate
            );

            // Apply rotation to all squares in the plane
            for (let i = 0; i < rotateSquares.length; i++) {
                rotateSquares[i].applyMatrix4(rotateMatCurrent);
                rotateSquares[i].updateMatrix();
            }

            rotatedAngle += curRotate; // Update accumulated angle

            // Continue animation or finish
            if (Math.abs(rotatedAngle) < Math.abs(totalRotationAngle)) {
                this.rotateAnimationId = requestAnimationFrame(rotateTick); // Request next frame
            } else {
                // Animation finished
                this.rotateAnimationId = null;
                // Update the cube state after the animation
                this.state.activeSquares = rotateSquares;
                this.state.rotateAxisLocal = axis;
                this.state.rotateAnglePI = totalRotationAngle;
                this.updateStateAfterRotate(); // Finalize state (positions, normals)
                this.state.inRotation = false; // Mark rotation as complete

                if (onComplete) onComplete(); // Execute callback
            }
        };

        rotateTick(); // Start the animation
    }

    /**
     * Rotates a specific plane of the cube instantly (without animation) by a given angle (multiple of 90 degrees).
     *
     * @param {SquareMesh} controlSquare - A square on the plane to be rotated.
     * @param {Vector3} axis - The axis of rotation in world space.
     * @param {number} angle90 - The rotation angle in multiples of 90 degrees (e.g., 1 for 90, -1 for -90, 2 for 180).
     */
    public rotatePlane2(
        controlSquare: SquareMesh,
        axis: Vector3,
        angle90: number
    ) {
        // 1. Identify squares in the plane (same logic as animated version)
        const rotateSquares: SquareMesh[] = [];
        const controlTemPos = getTemPos(controlSquare, this.data.elementSize);
        for (let i = 0; i < this.squares.length; i++) {
            const squareTemPos = getTemPos(
                this.squares[i],
                this.data.elementSize
            );
            const squareVec = controlTemPos.clone().sub(squareTemPos);
            if (squareVec.dot(axis) === 0) {
                rotateSquares.push(this.squares[i]);
            }
        }

        // 2. Calculate total rotation angle and create the matrix
        const totalRotationAngle = angle90 * (Math.PI * 0.5);
        const rotateMat = new Matrix4();
        rotateMat.makeRotationAxis(
            axis.clone().normalize(),
            totalRotationAngle
        );

        // 3. Apply the rotation instantly
        for (let i = 0; i < rotateSquares.length; i++) {
            rotateSquares[i].applyMatrix4(rotateMat);
            rotateSquares[i].updateMatrix();
        }

        // 4. Update the cube state
        this.state.activeSquares = rotateSquares;
        this.state.rotateAxisLocal = axis;
        this.state.rotateAnglePI = totalRotationAngle;
        this.updateStateAfterRotate(); // Finalize state (positions, normals)
        this.state.inRotation = false; // Mark rotation as complete

        // 5. Optional: Save data and update status
        this.data.saveDataToLocal();
        setFinish(this.finish);
    }

    /**
     * Scrambles the cube by applying a specified number of random plane rotations instantly.
     *
     * @param {number} count - The number of random rotations to apply.
     */
    public scrambleSmart(count: number) {
        const axes = [
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1),
        ]; // Possible rotation axes
        for (let i = 0; i < count; i++) {
            const controlSquare = this.getRandomControlSquare(); // Pick a random square to define the plane
            const axis = axes[Math.floor(Math.random() * axes.length)]; // Pick a random axis
            const angle = Math.random() > 0.5 ? 1 : -1; // Pick a random direction (+90 or -90)
            this.rotatePlane2(controlSquare, axis, angle); // Apply instant rotation
        }
    }

    /**
     * Scrambles the cube by applying a specified number of random plane rotations with animation.
     * Rotations are applied sequentially with a small delay between them.
     *
     * @param {number} count - The number of random rotations to apply.
     * @param {() => void} [onComplete] - Optional callback function executed when the entire scramble animation finishes.
     */
    public scrambleSmartAnimated(count: number, onComplete?: () => void) {
        const axes = [
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1),
        ]; // Possible axes
        let current = 0; // Counter for completed rotations

        // Function to perform one scramble rotation and schedule the next
        const doOneScramble = () => {
            // Base case: all rotations completed
            if (current >= count) {
                if (onComplete) onComplete(); // Execute final callback
                return;
            }

            // Select random square, axis, and angle for this rotation
            const controlSquare = this.getRandomControlSquare();
            const axis = axes[Math.floor(Math.random() * axes.length)];
            const angle = Math.random() > 0.5 ? 1 : -1;

            // Perform the animated rotation
            this.rotatePlane(controlSquare, axis, angle, () => {
                // This callback executes when the single rotation animation completes
                current++; // Increment counter
                // Schedule the next rotation after a short delay
                setTimeout(() => {
                    requestAnimationFrame(doOneScramble);
                }, 10);  // Wait before the next rotation
            });
        };

        doOneScramble(); // Start the first rotation
    }

    /**
     * Selects a random square mesh from the cube.
     * Used as a starting point for defining a plane in scrambling methods.
     *
     * @returns {SquareMesh} A randomly selected square mesh.
     */
    private getRandomControlSquare(): SquareMesh {
        // Pick a random index within the bounds of the squares array
        const idx = Math.floor(Math.random() * this.squares.length);
        return this.squares[idx];
    }
}
