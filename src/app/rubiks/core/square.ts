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
    MeshPhysicalMaterial,
    BackSide,
} from "three";
import { CubeElement } from "./cubeData";

const textureLoader = new TextureLoader();

// helper to create different physical materials with only needed PBR properties
const createRubikMaterial = (type: string, color: Color) => {
    switch (type) {
        case "plastic":
            return new MeshPhysicalMaterial({
                color,
                metalness: 0,
                roughness: 0.5,
                envMapIntensity: 1,
            });
        case "glass":
            return new MeshPhysicalMaterial({
                color,
                metalness: 0.9,
                roughness: 0.05,
                envMapIntensity: 0.9,
                transparent: true,
                opacity: 0.5,
                ior: 0.9,
                transmission: 0.95,
                side: BackSide,
            });
        case "metal":
            return new MeshPhysicalMaterial({
                color,
                metalness: 1,
                roughness: 0.4,
                envMapIntensity: 1,
                clearcoat: 0.1,
            });
        case "mostReflexMetal":
            return new MeshPhysicalMaterial({
                color,
                metalness: 1,
                roughness: 0,
                envMapIntensity: 1,
                clearcoat: 1,
            });
        case "mostBright":
            return new MeshPhysicalMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.5,
                metalness: 0.5,
                roughness: 0.1,
            });
        case "wooden":
            return new MeshPhysicalMaterial({
                color,
                metalness: 0,
                roughness: 1,
            });
        case "water":
            return new MeshPhysicalMaterial({
                color,
                transmission: 1,
                transparent: true,
                opacity: 1,
                ior: 1.33,
            });
        case "frost":
            return new MeshPhysicalMaterial({
                color,
                roughness: 0.8,
                transmission: 0.5,
                transparent: true,
                opacity: 0.8,
                ior: 1.5,
            });
        default:
            return new MeshPhysicalMaterial({
                color,
                metalness: 0.5,
                roughness: 0.5,
                envMapIntensity: 1,
            });
    }
};

export const createSquare = (
    color: Color,
    element: CubeElement,
    materialType: string
) => {
    const squareShape = new Shape();
    const x = 0,
        y = 0;
    // top
    squareShape.moveTo(x - 0.4, y + 0.5);
    squareShape.lineTo(x + 0.4, y + 0.5);
    squareShape.bezierCurveTo(
        x + 0.5,
        y + 0.5,
        x + 0.5,
        y + 0.5,
        x + 0.5,
        y + 0.4
    );

    // right
    squareShape.lineTo(x + 0.5, y - 0.4);
    squareShape.bezierCurveTo(
        x + 0.5,
        y - 0.5,
        x + 0.5,
        y - 0.5,
        x + 0.4,
        y - 0.5
    );

    // bottom
    squareShape.lineTo(x - 0.4, y - 0.5);
    squareShape.bezierCurveTo(
        x - 0.5,
        y - 0.5,
        x - 0.5,
        y - 0.5,
        x - 0.5,
        y - 0.4
    );

    // left
    squareShape.lineTo(x - 0.5, y + 0.4);
    squareShape.bezierCurveTo(
        x - 0.5,
        y + 0.5,
        x - 0.5,
        y + 0.5,
        x - 0.4,
        y + 0.5
    );

    const geometry = new ShapeGeometry(squareShape);
    const material = createRubikMaterial(materialType, color);
    const mesh = new Mesh(geometry, material);
    mesh.scale.set(0.9, 0.9, 0.9);

    const square = new SquareMesh(element);
    square.add(mesh);

    // add backplane only for opaque materials; skip for transparent types
    if (
        materialType !== "glass" &&
        materialType !== "water" &&
        materialType !== "frost"
    ) {
        const mat2 = new MeshBasicMaterial({
            color: "black",
            side: DoubleSide,
        });
        const plane = new Mesh(geometry, mat2);
        plane.position.set(0, 0, -0.01);
        square.add(plane);
    }

    const posX = element.pos.x;
    const posY = element.pos.y;
    const posZ = element.pos.z;
    square.position.set(posX, posY, posZ);

    if (element.withLogo) {
        textureLoader.load("/tungtungtungsahurr.png", (texture) => {
            const geo2 = new PlaneGeometry(1, 1, 1);
            const mat3 = new MeshBasicMaterial({
                map: texture,
                transparent: true,
            });
            const avatarPlane = new Mesh(geo2, mat3);
            avatarPlane.position.set(0, 0, 0.01);
            avatarPlane.scale.set(0.8, 0.8, 0.8);
            square.add(avatarPlane);
        });
    }

    square.lookAt(element.pos.clone().add(element.normal));
    return square;
};

export class SquareMesh extends Object3D {
    public element: CubeElement;
    public constructor(element: CubeElement) {
        super();
        this.element = element;
    }
}
