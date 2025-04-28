import {
    Object3D,
    Color, 
    Group, 
} from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CubeElement } from "./cubeData"; // ข้อมูลตำแหน่งและ normal แต่ละช่อง

// ตัวโหลดโมเดล
const gltfLoader = new GLTFLoader();

/**
 * สร้าง SquareMesh ที่แทนด้วยโมเดล 3D
 *
 * @param {Color} color - ไม่ได้ใช้จริง แต่ยังรับไว้เผื่อ
 * @param {CubeElement} element - ข้อมูลตำแหน่งและ normal
 * @param {string} modelUrl - URL หรือ path ไปยังไฟล์โมเดล .glb
 * @returns {Promise<SquareMesh>} - ส่งกลับเป็น SquareMesh พร้อมโมเดลข้างใน
 */

export const createSquare = async (
    color: Color,
    element: CubeElement,
    modelUrl: string
): Promise<SquareMesh> => {

    // โหลดโมเดลด้วย async/await
    const gltf = await gltfLoader.loadAsync(modelUrl);
    const model = gltf.scene;

    // สร้าง SquareMesh ใหม่
    const square = new SquareMesh(element);

    // ปรับขนาดและหมุนโมเดลให้เหมาะสม
    model.scale.set(0.4, 0.4, 0.4); // ขนาดเล็กลงนิดนึง
    model.position.set(0, 0, 0);     // วางตรงกลาง SquareMesh
    model.rotation.set(0, 0, 0);     // หมุนถ้าจำเป็น

    // ใส่โมเดลเข้าไปใน SquareMesh
    square.add(model);

    // ตั้งตำแหน่งในโลก 3D
    square.position.set(element.pos.x, element.pos.y, element.pos.z);

    // ให้ชิ้นหันหน้าออกไปตาม normal
    square.lookAt(element.pos.clone().add(element.normal));

    return square;
};

/**
 * คลาสเก็บ SquareMesh
 */
export class SquareMesh extends Object3D {
    public element: CubeElement;

    constructor(element: CubeElement) {
        super();
        this.element = element;
    }
}