import {
    Object3D,
    Color,
} from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CubeElement } from "./cubeData";

const gltfLoader = new GLTFLoader();

export const createSquare = async (
    color: Color,
    element: CubeElement,
    modelUrl: string
): Promise<SquareMesh> => {
    const gltf = await gltfLoader.loadAsync(modelUrl);
    const model = gltf.scene;

    const square = new SquareMesh(element);

    model.scale.set(0.4, 0.4, 0.4);  // ย่อมังกร
    model.position.set(0, 0, 0);      // ตั้งให้อยู่กลางกล่อง
    model.rotation.set(0, 0, 0);      // ไม่หมุน (หรือหมุนเองถ้าอยาก)

    square.add(model);                // ❗ ใส่ทุกก้อน ❗

    square.position.set(element.pos.x, element.pos.y, element.pos.z);

    // ❗ ไม่ต้อง lookAt แล้ว
    // square.lookAt(...); --> ลบทิ้ง!

    return square;
};

export class SquareMesh extends Object3D {
    public element: CubeElement;

    constructor(element: CubeElement) {
        super();
        this.element = element;
    }
}
