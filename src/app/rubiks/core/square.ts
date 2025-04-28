import {
    Shape,
    ShapeGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial,
    Mesh,
    Color,
    Object3D,
    PlaneGeometry,
    DoubleSide,
    TextureLoader,
} from "three";
import { CubeElement } from "./cubeData";

// Initialize a texture loader for loading images onto squares.
const textureLoader = new TextureLoader();

/**
 * Creates a single square mesh for the Rubik's Cube.
 * This includes the colored face, a black backing, and optionally an image texture.
 * The square is positioned and oriented based on the provided CubeElement data.
 *
 * @param {Color} color - The primary color of the square face.
 * @param {CubeElement} element - The data defining the square's properties (position, normal, etc.).
 * @param {string} [imageUrl] - Optional URL of an image to apply as a texture to the square face.
 * @returns {SquareMesh} A configured SquareMesh object ready to be added to the cube group.
 */
export const createSquare = (
    color: Color,
    element: CubeElement,
    imageUrl?: string
) => {
    // Define the shape of the square with rounded corners using Three.js Shape API.
    const squareShape = new Shape();
    const x = 0,
        y = 0; // Center coordinates for shape definition
    const cornerRadius = 0.1; // Controls how rounded the corners are
    const edgeOffset = 0.5 - cornerRadius; // Distance from center to start of straight edge

    // Define the path for the rounded square shape
    squareShape.moveTo(x - edgeOffset, y + 0.5); // Start top-left edge
    squareShape.lineTo(x + edgeOffset, y + 0.5); // Top edge
    squareShape.bezierCurveTo(
        // Top-right corner
        x + 0.5,
        y + 0.5,
        x + 0.5,
        y + 0.5,
        x + 0.5,
        y + edgeOffset
    );
    squareShape.lineTo(x + 0.5, y - edgeOffset); // Right edge
    squareShape.bezierCurveTo(
        // Bottom-right corner
        x + 0.5,
        y - 0.5,
        x + 0.5,
        y - 0.5,
        x + edgeOffset,
        y - 0.5
    );
    squareShape.lineTo(x - edgeOffset, y - 0.5); // Bottom edge
    squareShape.bezierCurveTo(
        // Bottom-left corner
        x - 0.5,
        y - 0.5,
        x - 0.5,
        y - 0.5,
        x - 0.5,
        y - edgeOffset
    );
    squareShape.lineTo(x - 0.5, y + edgeOffset); // Left edge
    squareShape.bezierCurveTo(
        // Top-left corner
        x - 0.5,
        y + 0.5,
        x - 0.5,
        y + 0.5,
        x - edgeOffset,
        y + 0.5
    );

    // Create geometry from the defined shape.
    const geometry = new ShapeGeometry(squareShape);
    // Create the main material for the colored face with some metallic/roughness properties.
    const material = new MeshStandardMaterial({
        color,
        metalness: 0.6,
        roughness: 0.2,
        envMapIntensity: 1,
    });
    // Create the mesh for the colored face.
    const mesh = new Mesh(geometry, material);
    // Slightly scale down the colored face to create a border effect with the backing.
    mesh.scale.set(0.9, 0.9, 0.9);

    // Create the SquareMesh container object, associating it with the element data.
    const square = new SquareMesh(element);
    // Add the colored face mesh to the container.
    square.add(mesh);

    // Create a simple black material for the backing plane.
    const mat2 = new MeshBasicMaterial({
        color: "black",
        side: DoubleSide, // Render both sides of the backing plane.
    });

    // Create the backing plane using the same rounded square geometry.
    const plane = new Mesh(geometry, mat2);
    // Position the backing plane slightly behind the colored face.
    plane.position.set(0, 0, -0.01);
    // Add the backing plane to the container.
    square.add(plane);

    // Extract position coordinates from the element data.
    const posX = element.pos.x;
    const posY = element.pos.y;
    const posZ = element.pos.z;
    // Set the position of the SquareMesh container in world space.
    square.position.set(posX, posY, posZ);

    // If an image URL is provided, load and apply it as a texture.
    if (imageUrl) {
        textureLoader.load(imageUrl, (texture) => {
            // Create a simple plane geometry for the image.
            const geo2 = new PlaneGeometry(1, 1, 1);
            // Create material with the loaded texture, making it semi-transparent.
            const mat3 = new MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.5,
            });
            // Create the mesh for the image plane.
            const avatarPlane = new Mesh(geo2, mat3);
            // Position the image plane slightly in front of the colored face.
            avatarPlane.position.set(0, 0, 0.01);
            // Scale the image plane slightly smaller than the square face.
            avatarPlane.scale.set(0.8, 0.8, 0.8);
            // Add the image plane to the container.
            square.add(avatarPlane);
        });
    }

    // Orient the square container to face outwards according to its normal vector.
    // It looks at a point slightly offset from its position along its normal.
    square.lookAt(element.pos.clone().add(element.normal));
    // Return the fully configured SquareMesh object.
    return square;
};

/**
 * Represents a single square facelet of the Rubik's Cube as a 3D object.
 * Extends Three.js Object3D to act as a container for the visual meshes (color, backing, image).
 * Holds a reference to the underlying logical data (`CubeElement`).
 */
export class SquareMesh extends Object3D {
    /** The logical data associated with this square (color, position, normal). */
    public element: CubeElement;
    /**
     * Creates an instance of SquareMesh.
     * @param {CubeElement} element - The logical data for this square.
     */
    public constructor(element: CubeElement) {
        super();
        this.element = element;
    }
}
