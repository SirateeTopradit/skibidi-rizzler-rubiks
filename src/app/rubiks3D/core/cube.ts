import { Camera, Color, Group, Matrix4, Vector2, Vector3 } from "three";
import { setFinish } from "./statusbar";
import { getAngleBetweenTwoVector2, equalDirection } from "../util/math";
import { ndcToScreen } from "../util/transform";
import CubeData from "./cubeData";
import CubeState, { RotateDirection } from "./cubeState";
import { createSquare, SquareMesh } from "./square";

const getTemPos = (square: SquareMesh, squareSize: number) => {
    const moveVect = square.element.normal
        .clone()
        .normalize()
        .multiplyScalar(-0.5 * squareSize);
    const pos = square.element.pos.clone();
    return pos.add(moveVect);
};

export class Cube extends Group {
    private modelUrl?: string;
    private data: CubeData;
    public state!: CubeState;
    private rotateAnimationId: number | null = null;

    // เพิ่มระบบความปลอดภัย
    private readyPromise: Promise<void>;
    private ready: boolean = false;

    public get squares() {
        return this.children as SquareMesh[];
    }

    public get order() {
        return this.data.cubeOrder;
    }

    public get squareSize() {
        return this.data.elementSize;
    }

    public get finish() {
        return this.state.validateFinish();
    }

    public constructor(order = 3, modelUrl?: string) {
        super();

        this.modelUrl = modelUrl;
        this.data = new CubeData(order);

        this.rotateX(Math.PI * 0.25);
        this.rotateY(Math.PI * 0.25);

        this.readyPromise = this.createChildrenByData().then(() => {
            this.ready = true;
            setFinish(this.finish);
        });
    }

    private async awaitReady() {
        if (!this.ready) {
            await this.readyPromise;
        }
    }

    private async createChildrenByData() {
        this.remove(...this.children);

        const squares: SquareMesh[] = [];

        for (let i = 0; i < this.data.elements.length; i++) {
            const element = this.data.elements[i];
            const square = await createSquare(
                new Color(element.color),
                element,
                '/models/block.glb',
            );
            this.add(square);
            squares.push(square);
        }

        this.state = new CubeState(squares);
    }

    public async disorder() {
        await this.awaitReady();

        const colors = this.data.elements.map((e) => e.color);
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        this.data.elements.forEach((e, idx) => {
            e.color = colors[idx];
        });

        await this.createChildrenByData();
        setFinish(this.finish);
    }

    public async restore() {
        await this.awaitReady();

        if (this.rotateAnimationId !== null) {
            cancelAnimationFrame(this.rotateAnimationId);
            this.rotateAnimationId = null;
        }

        this.data.initialFinishData();
        this.data.saveDataToLocal();

        await this.createChildrenByData();
        setFinish(this.finish);
    }

    public async scrambleSmart(count: number) {
        await this.awaitReady();

        const axes = [
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1),
        ];

        for (let i = 0; i < count; i++) {
            const controlSquare = this.getRandomControlSquare();
            const axis = axes[Math.floor(Math.random() * axes.length)];
            const angle = Math.random() > 0.5 ? 1 : -1;

            this.rotatePlane2(controlSquare, axis, angle);
        }
    }

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

    public async scrambleSmartAnimated(count: number, onComplete?: () => void) {
        await this.awaitReady();

        const axes = [
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(0, 0, 1),
        ];

        let current = 0;

        const doOneScramble = () => {
            if (current >= count) {
                if (onComplete) onComplete();
                return;
            }

            const controlSquare = this.getRandomControlSquare();
            const axis = axes[Math.floor(Math.random() * axes.length)];
            const angle = Math.random() > 0.5 ? 1 : -1;

            this.rotatePlane(controlSquare, axis, angle, () => {
                current++;
                setTimeout(() => {
                    requestAnimationFrame(doOneScramble);
                }, 10);
            });
        };

        doOneScramble();
    }

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

    private getRandomControlSquare(): SquareMesh {
        const idx = Math.floor(Math.random() * this.squares.length);
        return this.squares[idx];
    }

    public async rotatePlane(
        controlSquare: SquareMesh,
        axis: Vector3,
        angle90: number,
        onComplete?: () => void
    ) {
        await this.awaitReady(); // รอให้สร้างเสร็จก่อน
    
        if (this.rotateAnimationId !== null) {
            cancelAnimationFrame(this.rotateAnimationId);
            this.rotateAnimationId = null;
        }
    
        const rotateSquares: SquareMesh[] = [];
        const controlTemPos = getTemPos(controlSquare, this.data.elementSize);
    
        for (let i = 0; i < this.squares.length; i++) {
            const squareTemPos = getTemPos(this.squares[i], this.data.elementSize);
            const squareVec = controlTemPos.clone().sub(squareTemPos);
    
            if (squareVec.dot(axis) === 0) {
                rotateSquares.push(this.squares[i]);
            }
        }
    
        const totalRotationAngle = angle90 * (Math.PI * 0.5);
        const numFrames = 30;
        const rotateSpeed = totalRotationAngle / numFrames;
    
        let rotatedAngle = 0;
    
        const rotateTick = () => {
            let curRotate = rotateSpeed;
            if (Math.abs(rotatedAngle + rotateSpeed) > Math.abs(totalRotationAngle)) {
                curRotate = totalRotationAngle - rotatedAngle;
            }
    
            const rotateMatCurrent = new Matrix4();
            rotateMatCurrent.makeRotationAxis(axis.clone().normalize(), curRotate);
    
            for (let i = 0; i < rotateSquares.length; i++) {
                rotateSquares[i].applyMatrix4(rotateMatCurrent);
                rotateSquares[i].updateMatrix();
            }
    
            rotatedAngle += curRotate;
            
            if (Math.abs(rotatedAngle) < Math.abs(totalRotationAngle)) {
                this.rotateAnimationId = requestAnimationFrame(rotateTick);
            } else {
                this.rotateAnimationId = null;
    
                this.state.activeSquares = rotateSquares;
                this.state.rotateAxisLocal = axis;
                this.state.rotateAnglePI = totalRotationAngle;

                
                this.updateStateAfterRotate();
                this.state.inRotation = false;
    
                if (onComplete) onComplete();
            }
        };
    
        rotateTick();
    }
    

    public async rotatePlane2(controlSquare: SquareMesh, axis: Vector3, angle90: number) {
        await this.awaitReady(); // รอให้พร้อมก่อน
    
        const rotateSquares: SquareMesh[] = [];
        const controlTemPos = getTemPos(controlSquare, this.data.elementSize);
    
        for (let i = 0; i < this.squares.length; i++) {
            const squareTemPos = getTemPos(this.squares[i], this.data.elementSize);
            const squareVec = controlTemPos.clone().sub(squareTemPos);
    
            if (squareVec.dot(axis) === 0) {
                rotateSquares.push(this.squares[i]);
            }
        }
    
        const totalRotationAngle = angle90 * (Math.PI * 0.5);
        const rotateMat = new Matrix4();
        rotateMat.makeRotationAxis(axis.clone().normalize(), totalRotationAngle);
    
        for (let i = 0; i < rotateSquares.length; i++) {
            rotateSquares[i].applyMatrix4(rotateMat);
            rotateSquares[i].updateMatrix();
        }
    
        this.state.activeSquares = rotateSquares;
        this.state.rotateAxisLocal = axis;
        this.state.rotateAnglePI = totalRotationAngle;
        this.updateStateAfterRotate();
        this.state.inRotation = false;
    
        this.data.saveDataToLocal();
        setFinish(this.finish);
    }
    
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

    private updateStateAfterRotate() {
        const needRotateAnglePI = this.getNeededRotateAngle();
        this.state.rotateAnglePI += needRotateAnglePI;

        const angleRelative360PI = this.state.rotateAnglePI % (Math.PI * 2);

        if (Math.abs(angleRelative360PI) > 0.1) {
            const rotateMat2 = new Matrix4();
            rotateMat2.makeRotationAxis(this.state.rotateAxisLocal!, angleRelative360PI);

            const pn: { nor: Vector3; pos: Vector3 }[] = [];

            for (let i = 0; i < this.state.activeSquares.length; i++) {
                const nor = this.state.activeSquares[i].element.normal.clone();
                const pos = this.state.activeSquares[i].element.pos.clone();
                nor.applyMatrix4(rotateMat2);
                pos.applyMatrix4(rotateMat2);

                for (let j = 0; j < this.state.activeSquares.length; j++) {
                    const nor2 = this.state.activeSquares[j].element.normal.clone();
                    const pos2 = this.state.activeSquares[j].element.pos.clone();

                    if (equalDirection(nor, nor2) && pos.distanceTo(pos2) < 0.1) {
                        pn.push({ nor: nor2, pos: pos2 });
                    }
                }
            }

            for (let i = 0; i < this.state.activeSquares.length; i++) {
                this.state.activeSquares[i].element.normal = pn[i].nor;
                this.state.activeSquares[i].element.pos = pn[i].pos;
            }
        }

        this.state.resetState();
    }

    public getCoarseCubeSize(camera: Camera, winSize: { w: number; h: number }) {
        const width = this.order * this.squareSize;
        const p1 = new Vector3(-width / 2, 0, 0);
        const p2 = new Vector3(width / 2, 0, 0);
    
        p1.project(camera);
        p2.project(camera);
    
        const { w, h } = winSize;
        const screenP1 = ndcToScreen(p1, w, h);
        const screenP2 = ndcToScreen(p2, w, h);
    
        return Math.abs(screenP2.x - screenP1.x);
    }

    private getNeededRotateAngle() {
        const rightAnglePI = Math.PI * 0.5;
        const exceedAnglePI = Math.abs(this.state.rotateAnglePI) % rightAnglePI;

        let needRotateAnglePI =
            exceedAnglePI > rightAnglePI * 0.5
                ? rightAnglePI - exceedAnglePI
                : -exceedAnglePI;

        needRotateAnglePI =
            this.state.rotateAnglePI > 0
                ? needRotateAnglePI
                : -needRotateAnglePI;

        return needRotateAnglePI;
    }
}
