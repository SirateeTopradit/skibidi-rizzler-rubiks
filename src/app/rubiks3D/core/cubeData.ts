import { Vector3 } from "three";

/** Type alias for color representation, can be a hex string or number. */
type ColorRepresentation = string | number;

/**
 * Interface defining the properties of a single square element on the Rubik's Cube.
 * @interface CubeElement
 * @property {ColorRepresentation} color - The color of the square.
 * @property {Vector3} pos - The 3D position of the square's center in local coordinates.
 * @property {Vector3} normal - The normal vector indicating the face the square belongs to.
 * @property {boolean} [withLogo] - Optional flag indicating if this square is the center piece (often has a logo).
 */
export interface CubeElement {
    color: ColorRepresentation;
    pos: Vector3;
    normal: Vector3;
    withLogo?: boolean;
}

/** Type alias for an array representing the six face colors of the cube. */
type CubeColor = [
    ColorRepresentation, // Top
    ColorRepresentation, // Bottom
    ColorRepresentation, // Left
    ColorRepresentation, // Right
    ColorRepresentation, // Front
    ColorRepresentation // Back
];

/**
 * Manages the underlying data structure for a Rubik's Cube.
 * Stores the color, position, and normal for each individual square element.
 * Handles initialization, saving to, and loading from localStorage.
 */
class CubeData {
    /** The order (size) of the cube (e.g., 3 for a 3x3x3 cube). */
    public cubeOrder: number;

    /** Array storing the six face colors. */
    private colors: CubeColor;
    /** The size of a single square element. Default is 1. */
    private _size = 1;
    /**
     * Getter for the size of a single square element.
     * @returns {number} The size of one square.
     */
    public get elementSize() {
        return this._size;
    }
    /** Array containing the data for all square elements of the cube. */
    public elements: CubeElement[] = [];

    /**
     * Creates an instance of CubeData.
     * Initializes the cube elements, attempting to load from localStorage first.
     *
     * @param {number} [cubeOrder=3] - The order of the cube.
     * @param {CubeColor} [colors] - An array of six colors for the faces. Defaults to standard Rubik's colors.
     */
    public constructor(
        cubeOrder = 3,
        colors: CubeColor = [
            "#FF0000", // Top (Red)
            "#FFA500", // Bottom (Orange)
            "#008000", // Left (Green)
            "#0000FF", // Right (Blue)
            "#FFFF00", // Front (Yellow)
            "#FFFFFF", // Back (White)
        ]
    ) {
        this.cubeOrder = cubeOrder;
        this.colors = colors;
        localStorage.removeItem(`${this.cubeOrder}-Rubik`);
        this.initElements(); // Initialize elements, trying local storage first
    }

    /**
     * Initializes the `elements` array.
     * Attempts to load data from localStorage first if `localDataFirst` is true.
     * If no valid local data is found, it generates the data for a solved cube.
     *
     * @param {boolean} [localDataFirst=true] - Whether to prioritize loading from localStorage.
     */
    private initElements(localDataFirst = true) {
        // Try loading from localStorage if enabled and available
        if (localDataFirst && typeof localStorage !== "undefined") {
            this.elements = this.getLocalData();
        }

        // Check if the loaded data matches the expected number of elements for the current order
        // The total number of squares is order * order * 6 faces.
        if (this.elements.length === this.cubeOrder * this.cubeOrder * 6) {
            return; // Data loaded successfully or already initialized
        }

        // If no valid local data, generate the data for a solved cube
        this.initialFinishData();
    }

    /**
     * Generates the `elements` array for a solved Rubik's Cube of the specified order.
     * Calculates the position and normal for each square on each of the six faces.
     */
    public initialFinishData() {
        this.elements = [];
    
        const half = (this.cubeOrder - 1) / 2; // เช่น 3 → 1
    
        for (let x = -half; x <= half; x++) {
            for (let y = -half; y <= half; y++) {
                for (let z = -half; z <= half; z++) {
                    // สร้างทุกก้อนใน 3D
                    this.elements.push({
                        color: "#ffffff", // ใช้สีขาวเป็น default ไปก่อน
                        pos: new Vector3(x, y, z),
                        normal: new Vector3(0, 0, 1), // normal ไม่จำเป็นถ้าไม่ lookAt
                        withLogo: (x === 0 && y === 0 && z === 0) // ตรงกลางพอดี
                    });
                }
            }
        }
    }
    

    /**
     * Saves the current state of the `elements` array to localStorage.
     * The data is stored as a JSON string under a key specific to the cube order.
     */
    public saveDataToLocal() {
        // Convert elements array to JSON string
        const data = JSON.stringify(this.elements);

        // Save to localStorage if available
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(`${this.cubeOrder}-Rubik`, data);
        }
    }

    /**
     * Retrieves and parses the cube data from localStorage.
     * Reconstructs Vector3 objects from the stored plain object data.
     *
     * @returns {CubeElement[]} An array of CubeElement objects, or an empty array if no data is found or localStorage is unavailable.
     */
    public getLocalData(): CubeElement[] {
        // Check if localStorage is available
        if (typeof localStorage !== "undefined") {
            // Retrieve data string using the order-specific key
            const data = localStorage.getItem(`${this.cubeOrder}-Rubik`);

            if (data) {
                try {
                    // Parse the JSON string
                    const parseData: {
                        color: ColorRepresentation;
                        pos: { x: number; y: number; z: number };
                        normal: { x: number; y: number; z: number };
                        withLogo?: boolean;
                    }[] = JSON.parse(data);

                    // Reconstruct Vector3 objects for position and normal
                    parseData.forEach((item) => {
                        item.normal = new Vector3(
                            item.normal.x,
                            item.normal.y,
                            item.normal.z
                        );
                        item.pos = new Vector3(
                            item.pos.x,
                            item.pos.y,
                            item.pos.z
                        );
                    });

                    // Return the reconstructed data, cast to the correct type
                    return parseData as CubeElement[];
                } catch (error) {
                    console.error(
                        "Error parsing cube data from localStorage:",
                        error
                    );
                    // Clear potentially corrupted data
                    localStorage.removeItem(`${this.cubeOrder}-Rubik`);
                    return [];
                }
            }
        }
        // Return empty array if localStorage is unavailable or no data found
        return [];
    }
}

export default CubeData;
