import { Matrix4, Object3D, Vector3 } from "three";

/**
 * Rotates a Three.js Object3D around a specified axis in world space.
 * Modifies the object's matrix and rotation properties directly.
 *
 * @param {Object3D} object - The object to rotate.
 * @param {Vector3} axis - The axis of rotation (should be normalized, but the function normalizes it just in case).
 * @param {number} radians - The angle of rotation in radians.
 */
export const rotateAroundWorldAxis = (
    object: Object3D,
    axis: Vector3,
    radians: number
) => {
    // Create a new Matrix4 to represent the rotation.
    const mat = new Matrix4();
    // Set the matrix to represent a rotation around the given axis (normalized) by the specified angle.
    mat.makeRotationAxis(axis.normalize(), radians);

    // Multiply the new rotation matrix by the object's current world matrix.
    // This effectively applies the new rotation *before* the object's existing transformations.
    mat.multiply(object.matrix);

    // Assign the resulting matrix back to the object's matrix.
    object.matrix = mat;

    // Update the object's rotation property (Euler angles) to match the new matrix.
    // This ensures consistency if the rotation property is used elsewhere.
    object.rotation.setFromRotationMatrix(object.matrix);
};

/**
 * Converts Normalized Device Coordinates (NDC) to screen coordinates (pixels).
 * NDC range from -1 to +1 in both x and y axes, with (0,0) at the center.
 * Screen coordinates typically have (0,0) at the top-left corner.
 *
 * @param {{x: number; y: number}} ndc - The point in Normalized Device Coordinates.
 * @param {number} winW - The width of the screen or canvas in pixels.
 * @param {number} winH - The height of the screen or canvas in pixels.
 * @returns {{x: number, y: number}} The corresponding point in screen coordinates.
 */
export const ndcToScreen = (
    ndc: { x: number; y: number },
    winW: number,
    winH: number
) => {
    // Calculate half the width and height for easier conversion.
    const halfW = winW * 0.5;
    const halfH = winH * 0.5;

    // Convert NDC x-coordinate to screen x-coordinate.
    // NDC x ranges from -1 (left) to +1 (right).
    // Screen x ranges from 0 (left) to winW (right).
    // Formula: screenX = (ndcX * halfW) + halfW
    const x = ndc.x * halfW + halfW;

    // Convert NDC y-coordinate to screen y-coordinate.
    // NDC y ranges from -1 (bottom) to +1 (top).
    // Screen y ranges from 0 (top) to winH (bottom).
    // Formula: screenY = halfH - (ndcY * halfH)  (Note the inversion of y-axis)
    const y = halfH - ndc.y * halfH;

    // Return the calculated screen coordinates.
    return { x, y };
};
