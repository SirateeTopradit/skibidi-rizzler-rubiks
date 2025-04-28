import { Vector2, Vector3 } from "three";

/**
 * Calculates the angle between two 2D vectors.
 *
 * @param {Vector2} vec1 - The first vector.
 * @param {Vector2} vec2 - The second vector.
 * @returns {number} The angle between the vectors in radians.
 */
export const getAngleBetweenTwoVector2 = (vec1: Vector2, vec2: Vector2) => {
    // Calculate the dot product of the two vectors.
    // A clone is used to avoid modifying the original vector.
    const dotValue = vec1.clone().dot(vec2);
    // Calculate the angle using the arccosine of the dot product divided by the product of the vector lengths.
    // This formula comes from the definition of the dot product: a · b = |a| |b| cos(θ)
    const angle = Math.acos(dotValue / (vec1.length() * vec2.length()));

    // Return the calculated angle.
    return angle;
};

/**
 * Checks if two 3D vectors point in approximately the same direction.
 *
 * @param {Vector3} vec1 - The first vector.
 * @param {Vector3} vec2 - The second vector.
 * @param {number} [precision=0.1] - The maximum allowed angle difference (in radians) for the vectors to be considered pointing in the same direction.
 * @returns {boolean} True if the angle between the vectors is less than the specified precision, false otherwise.
 */
export const equalDirection = (
    vec1: Vector3,
    vec2: Vector3,
    precision = 0.1
) => {
    // Calculate the angle between the two vectors using Three.js's built-in angleTo method.
    const angle = vec1.angleTo(vec2);

    // Check if the absolute value of the angle is within the allowed precision.
    // This determines if the vectors are pointing in roughly the same direction.
    return Math.abs(angle) < precision;
};
