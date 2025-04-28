import { Vector3, Vector2 } from "three";
import { SquareMesh } from "./square";

/**
 * Interface defining the direction of a rotation initiated by user input.
 * @interface RotateDirection
 * @property {Vector2} screenDir - The normalized direction of the drag movement on the screen.
 * @property {SquareMesh} startSquare - The square where the drag started.
 * @property {SquareMesh} endSquare - An adjacent square in the direction of the drag, used to determine the rotation axis.
 */
export interface RotateDirection {
    screenDir: Vector2;
    startSquare: SquareMesh;
    endSquare: SquareMesh;
}

/**
 * Manages the dynamic state of the Rubik's Cube, particularly during rotations.
 * Tracks which squares are currently rotating, the axis and angle of rotation,
 * and provides validation for the solved state.
 */
class CubeState {
    /** Array of all square meshes belonging to the cube. */
    private _squares: SquareMesh[];
    /** Flag indicating if a plane rotation is currently in progress (either dragging or animating). */
    public inRotation = false;
    /** The accumulated rotation angle (in radians) during a drag operation. Reset after snapping. */
    public rotateAnglePI = 0;
    /** The array of square meshes that are part of the currently rotating plane. */
    public activeSquares: SquareMesh[] = [];
    /** The specific square mesh that the user initially clicked to start the rotation. */
    public controlSquare: SquareMesh | undefined;
    /** The calculated direction information for the current rotation. */
    public rotateDirection: RotateDirection | undefined;
    /** The axis of rotation in the cube's local coordinate system. */
    public rotateAxisLocal: Vector3 | undefined;

    /**
     * Creates an instance of CubeState.
     * @param {SquareMesh[]} squares - An array containing all the square meshes of the cube.
     */
    public constructor(squares: SquareMesh[]) {
        this._squares = squares;
    }

    /**
     * Sets the state to indicate that a rotation is starting.
     * Stores information about the rotation axis, direction, and the squares involved.
     *
     * @param {SquareMesh} control - The square the user clicked on.
     * @param {SquareMesh[]} actives - The squares belonging to the plane being rotated.
     * @param {RotateDirection} direction - Information about the drag direction.
     * @param {Vector3} rotateAxisLocal - The calculated axis of rotation in local space.
     */
    public setRotating(
        control: SquareMesh,
        actives: SquareMesh[],
        direction: RotateDirection,
        rotateAxisLocal: Vector3
    ) {
        this.inRotation = true;
        this.controlSquare = control;
        this.activeSquares = actives;
        this.rotateDirection = direction;
        this.rotateAxisLocal = rotateAxisLocal;
    }

    /**
     * Resets the rotation state, typically called after a rotation animation completes.
     * Clears active squares, rotation axis, direction, and angle.
     */
    public resetState() {
        this.inRotation = false;
        this.activeSquares = [];
        this.controlSquare = undefined;
        this.rotateDirection = undefined;
        this.rotateAxisLocal = undefined;
        this.rotateAnglePI = 0;
    }

    /**
     * Checks if the cube is currently in a solved state.
     * A cube is solved if all squares on each face have the same color.
     *
     * @returns {boolean} True if the cube is solved, false otherwise.
     */
    public validateFinish() {
        let finish = true; // Assume solved initially

        // Define the six faces by their normal vectors
        const sixPlane: {
            nor: Vector3; // Normal vector of the face
            squares: SquareMesh[]; // Squares belonging to this face
        }[] = [
            { nor: new Vector3(0, 1, 0), squares: [] }, // Top (Y+)
            { nor: new Vector3(0, -1, 0), squares: [] }, // Bottom (Y-)
            { nor: new Vector3(-1, 0, 0), squares: [] }, // Left (X-)
            { nor: new Vector3(1, 0, 0), squares: [] }, // Right (X+)
            { nor: new Vector3(0, 0, 1), squares: [] }, // Front (Z+)
            { nor: new Vector3(0, 0, -1), squares: [] }, // Back (Z-)
        ];

        // Group all squares by the face (normal vector) they belong to
        for (let i = 0; i < this._squares.length; i++) {
            const plane = sixPlane.find((item) =>
                // Compare the square's normal with the face's normal
                this._squares[i].element.normal.equals(item.nor)
            );
            // Add the square to the corresponding face's array
            // The non-null assertion (!) is used assuming every square must belong to one of the six faces.
            plane!.squares.push(this._squares[i]);
        }

        // Check each face to see if all its squares have the same color
        for (let i = 0; i < sixPlane.length; i++) {
            const plane = sixPlane[i];
            // Use `every` to check if all squares in the plane match the color of the first square
            if (
                !plane.squares.every(
                    (square) =>
                        square.element.color === plane.squares[0].element.color
                )
            ) {
                // If any face has mixed colors, the cube is not solved
                finish = false;
                break; // No need to check further faces
            }
        }

        // Return the final solved status
        return finish;
    }
}

export default CubeState;
