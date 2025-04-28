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
    private imageUrl?: string;
    private data: CubeData;
    public state!: CubeState;
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

    public constructor(order = 3, imageUrl?: string) {
        super();

        this.imageUrl = imageUrl;
        this.data = new CubeData(order);

        this.createChildrenByData();

        this.rotateX(Math.PI * 0.25);
        this.rotateY(Math.PI * 0.25);
        setFinish(this.finish);
    }

    private createChildrenByData() {
        this.remove(...this.children);

        for (let i = 0; i < this.data.elements.length; i++) {
            const square = createSquare(
                new Color(this.data.elements[i].color),
                this.data.elements[i],
                this.imageUrl
            );
            this.add(square);
        }

        this.state = new CubeState(this.squares);
    }

    public rotateOnePlane(
        mousePrePos: Vector2,
        mouseCurPos: Vector2,
        controlSquare: SquareMesh,
        camera: Camera,
        winSize: { w: number; h: number },
    ) {
        if (mouseCurPos.distanceTo(mousePrePos) < 5) {
            return;
        }

        if (!this.squares.includes(controlSquare)) {
            return;
        }

        const screenDir = mouseCurPos.clone().sub(mousePrePos);
        if (screenDir.x === 0 && screenDir.y === 0) return;
        if (!this.state.inRotation) {
            const squareScreenPos = this.getSquareScreenPos(
                controlSquare,
                camera,
                winSize
            ) as Vector2;

            const squareNormal = controlSquare.element.normal;
            const squarePos = controlSquare.element.pos;

            const commonDirSquares = this.squares.filter(
                (square) =>
                    square.element.normal.equals(squareNormal) &&
                    !square.element.pos.equals(squarePos)
            );

            let square1: SquareMesh | undefined;
            let square2: SquareMesh | undefined;
            for (let i = 0; i < commonDirSquares.length; i++) {
                if (squareNormal.x !== 0) {
                    if (commonDirSquares[i].element.pos.y === squarePos.y) {
                        square1 = commonDirSquares[i];
                    }
                    if (commonDirSquares[i].element.pos.z === squarePos.z) {
                        square2 = commonDirSquares[i];
                    }
                } else if (squareNormal.y !== 0) {
                    if (commonDirSquares[i].element.pos.x === squarePos.x) {
                        square1 = commonDirSquares[i];
                    }
                    if (commonDirSquares[i].element.pos.z === squarePos.z) {
                        square2 = commonDirSquares[i];
                    }
                } else if (squareNormal.z !== 0) {
                    if (commonDirSquares[i].element.pos.x === squarePos.x) {
                        square1 = commonDirSquares[i];
                    }
                    if (commonDirSquares[i].element.pos.y === squarePos.y) {
                        square2 = commonDirSquares[i];
                    }
                }

                if (square1 && square2) {
                    break;
                }
            }

            if (!square1 || !square2) {
                return;
            }

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

            let minAngle = Math.abs(
                getAngleBetweenTwoVector2(squareDirs[0].screenDir, screenDir)
            );
            let rotateDir = squareDirs[0]; // 最终确定的旋转方向

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

            const rotateDirLocal = rotateDir.endSquare.element.pos
                .clone()
                .sub(rotateDir.startSquare.element.pos)
                .normalize();
            const rotateAxisLocal = squareNormal
                .clone()
                .cross(rotateDirLocal)
                .normalize(); // 旋转的轴

            const rotateSquares: SquareMesh[] = [];
            const controlTemPos = getTemPos(
                controlSquare,
                this.data.elementSize
            );

            for (let i = 0; i < this.squares.length; i++) {
                const squareTemPos = getTemPos(
                    this.squares[i],
                    this.data.elementSize
                );
                const squareVec = controlTemPos.clone().sub(squareTemPos);
                if (squareVec.dot(rotateAxisLocal) === 0) {
                    rotateSquares.push(this.squares[i]);
                }
            }

            this.state.setRotating(
                controlSquare,
                rotateSquares,
                rotateDir,
                rotateAxisLocal
            );

        }

        const rotateSquares = this.state.activeSquares;
        const rotateAxisLocal = this.state.rotateAxisLocal;

        const temAngle = getAngleBetweenTwoVector2(
            this.state.rotateDirection!.screenDir,
            screenDir
        );
        const screenDirProjectRotateDirLen =
            Math.cos(temAngle) * screenDir.length();
        const coarseCubeSize = this.getCoarseCubeSize(camera, winSize);
        const rotateAnglePI =
            (screenDirProjectRotateDirLen / coarseCubeSize) * Math.PI * 0.5;
        const newRotateAnglePI = rotateAnglePI - this.state.rotateAnglePI;
        this.state.rotateAnglePI = rotateAnglePI;

        const rotateMat = new Matrix4();
        rotateMat.makeRotationAxis(rotateAxisLocal!, newRotateAnglePI);

        for (let i = 0; i < rotateSquares.length; i++) {
            rotateSquares[i].applyMatrix4(rotateMat);
            rotateSquares[i].updateMatrix();
        }
    }

    public getAfterRotateAnimation() {
        const needRotateAnglePI = this.getNeededRotateAngle();
        const rotateSpeed = (Math.PI * 0.5) / 500;
        let rotatedAngle = 0;
        let lastTick: number;
        const rotateTick = (tick: number): boolean => {
            if (!lastTick) {
                lastTick = tick;
            }
            const time = tick - lastTick;
            lastTick = tick;
            if (rotatedAngle < Math.abs(needRotateAnglePI)) {
                let curAngle = time * rotateSpeed;
                if (rotatedAngle + curAngle > Math.abs(needRotateAnglePI)) {
                    curAngle = Math.abs(needRotateAnglePI) - rotatedAngle;
                }
                rotatedAngle += curAngle;
                curAngle = needRotateAnglePI > 0 ? curAngle : -curAngle;

                const rotateMat = new Matrix4();
                rotateMat.makeRotationAxis(
                    this.state.rotateAxisLocal!,
                    curAngle
                );
                for (let i = 0; i < this.state.activeSquares.length; i++) {
                    this.state.activeSquares[i].applyMatrix4(rotateMat);
                    this.state.activeSquares[i].updateMatrix();
                }
                return true;
            } else {
                this.updateStateAfterRotate();
                this.data.saveDataToLocal();
                return false;
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
            rotateMat2.makeRotationAxis(
                this.state.rotateAxisLocal!,
                angleRelative360PI
            );

            const pn: {
                nor: Vector3;
                pos: Vector3;
            }[] = [];

            for (let i = 0; i < this.state.activeSquares.length; i++) {
                const nor = this.state.activeSquares[i].element.normal.clone();
                const pos = this.state.activeSquares[i].element.pos.clone();

                nor.applyMatrix4(rotateMat2);
                pos.applyMatrix4(rotateMat2);

                for (let j = 0; j < this.state.activeSquares.length; j++) {
                    const nor2 =
                        this.state.activeSquares[j].element.normal.clone();
                    const pos2 =
                        this.state.activeSquares[j].element.pos.clone();
                    if (
                        equalDirection(nor, nor2) &&
                        pos.distanceTo(pos2) < 0.1
                    ) {
                        pn.push({
                            nor: nor2,
                            pos: pos2,
                        });
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

    public getCoarseCubeSize(
        camera: Camera,
        winSize: { w: number; h: number }
    ) {
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

    private getSquareScreenPos(
        square: SquareMesh,
        camera: Camera,
        winSize: { w: number; h: number }
    ) {
        if (!this.squares.includes(square)) {
            return null;
        }

        const mat = new Matrix4()
            .multiply(square.matrixWorld)
            .multiply(this.matrix);

        const pos = new Vector3().applyMatrix4(mat);
        pos.project(camera);

        const { w, h } = winSize;
        return ndcToScreen(pos, w, h);
    }

    public disorder() {
        const colors = this.data.elements.map((e) => e.color);
        for (let i = colors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [colors[i], colors[j]] = [colors[j], colors[i]];
        }
        this.data.elements.forEach((e, idx) => {
            e.color = colors[idx];
        });
        this.createChildrenByData();
        setFinish(this.finish);
    }

    public restore() {
        if (this.rotateAnimationId !== null) {
            cancelAnimationFrame(this.rotateAnimationId);
            this.rotateAnimationId = null;
        }
        this.data.initialFinishData();
        this.data.saveDataToLocal();
        this.createChildrenByData();
        setFinish(this.finish);
    }
    
    private rotateAnimationId: number | null = null; // <-- add this at the top of your class

    public rotatePlane(controlSquare: SquareMesh, axis: Vector3, angle90: number, onComplete?: () => void) {
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

        //if (angle90 < 0) angle90 += 4;

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

    public scrambleSmart(count: number) {
        const axes = [new Vector3(1,0,0), new Vector3(0,1,0), new Vector3(0,0,1)];
        for (let i = 0; i < count; i++) {
            const controlSquare = this.getRandomControlSquare();
            const axis = axes[Math.floor(Math.random() * axes.length)];
            const angle = Math.random() > 0.5 ? 1 : -1;
            this.rotatePlane(controlSquare, axis, angle);
        }
    }

    public scrambleSmartAnimated(count: number, onComplete?: () => void) {
        const axes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
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
                }, 100);  // Wait before the next rotation
            });
        };
    
        doOneScramble(); // Start the scrambling animation
    }
    

    private getRandomControlSquare(): SquareMesh {
        // Pick any random square
        const idx = Math.floor(Math.random() * this.squares.length);
        return this.squares[idx];
    }
}
