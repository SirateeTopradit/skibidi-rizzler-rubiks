import {
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from "three";
import { Cube } from "./cube";
import { rotateAroundWorldAxis } from "../util/transform";
import { SquareMesh } from "./square";
import { setFinish } from "./statusbar";



/**
 * Abstract base class for user controls (mouse/touch) on the Rubik's Cube.
 */
abstract class Control {
    protected renderer: WebGLRenderer;
    protected scene: Scene;
    protected cube: Cube;
    protected camera: PerspectiveCamera;
    protected _square: SquareMesh | null = null;
    private start = false;
    private lastOperateUnfinish = false;
    private startPos: Vector2 = new Vector2();
    protected get domElement() {
        return this.renderer.domElement;
    }
    private raycaster = new Raycaster();
    public constructor(
        camera: PerspectiveCamera,
        scene: Scene,
        renderer: WebGLRenderer,
        cube: Cube
    ) {
        this.cube = cube;
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
    }
    /**
     * Returns the closest intersected square at the given screen offset, or null if none.
     */
    protected getIntersects(offsetX: number, offsetY: number) {
        const x = (offsetX / this.domElement.clientWidth) * 2 - 1;
        const y = -(offsetY / this.domElement.clientHeight) * 2 + 1;
        this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
        const intersectSquares: { distance: number; square: SquareMesh }[] = [];
        for (let i = 0; i < this.cube.squares.length; i++) {
            const intersects = this.raycaster.intersectObjects([
                this.cube.squares[i],
            ]);
            if (intersects.length > 0) {
                intersectSquares.push({
                    distance: intersects[0].distance,
                    square: this.cube.squares[i],
                });
            }
        }
        intersectSquares.sort(
            (item1, item2) => item1.distance - item2.distance
        );
        return intersectSquares.length > 0 ? intersectSquares[0] : null;
    }
    public abstract dispose(): void;
    /**
     * Called when a user interaction starts (mouse/touch down).
     */
    protected operateStart(offsetX: number, offsetY: number) {
        if (this.start) return;
        this.start = true;
        this.startPos = new Vector2();
        const intersect = this.getIntersects(offsetX, offsetY);
        this._square = null;
        if (intersect) {
            this._square = intersect.square;
            this.startPos = new Vector2(offsetX, offsetY);
            // testSquareScreenPosition(this.cube, this._square, this.camera); // Debug only
        }
    }
    /**
     * Called when a user drags (mouse/touch move).
     */
    protected operateDrag(
        offsetX: number,
        offsetY: number,
        movementX: number,
        movementY: number
    ) {
        if (this.start && !this.lastOperateUnfinish) {
            if (this._square) {
                const curMousePos = new Vector2(offsetX, offsetY);
                this.cube.rotateOnePlane(
                    this.startPos,
                    curMousePos,
                    this._square,
                    this.camera,
                    {
                        w: this.domElement.clientWidth,
                        h: this.domElement.clientHeight,
                    }
                );
            } else {
                const dx = movementX;
                const dy = -movementY;
                const movementLen = Math.sqrt(dx * dx + dy * dy);
                const cubeSize = this.cube.getCoarseCubeSize(this.camera, {
                    w: this.domElement.clientWidth,
                    h: this.domElement.clientHeight,
                });
                const rotateAngle = (Math.PI * movementLen) / cubeSize;
                const moveVect = new Vector2(dx, dy);
                const rotateDir = moveVect.rotateAround(
                    new Vector2(0, 0),
                    Math.PI * 0.5
                );
                rotateAroundWorldAxis(
                    this.cube,
                    new Vector3(rotateDir.x, rotateDir.y, 0),
                    rotateAngle
                );
            }
            this.renderer.render(this.scene, this.camera);
        }
    }
    /**
     * Called when a user interaction ends (mouse/touch up).
     */
    protected operateEnd() {
        if (!this.lastOperateUnfinish) {
            if (this._square) {
                const rotateAnimation = this.cube.getAfterRotateAnimation();
                this.lastOperateUnfinish = true;
                const animation = (time: number) => {
                    const next = rotateAnimation(time);
                    this.renderer.render(this.scene, this.camera);
                    if (next) {
                        requestAnimationFrame(animation);
                    } else {
                        setFinish(this.cube.finish);
                        this.lastOperateUnfinish = false;
                    }
                };
                requestAnimationFrame(animation);
            }
            this.start = false;
            this._square = null;
        }
    }
}

/**
 * Mouse-based user control for the Rubik's Cube.
 */
export class MouseControl extends Control {
    constructor(
        camera: PerspectiveCamera,
        scene: Scene,
        renderer: WebGLRenderer,
        cube: Cube
    ) {
        super(camera, scene, renderer, cube);
        // Bind event handlers once in constructor
        this.mousedownHandle = this.mousedownHandle.bind(this);
        this.mouseupHandle = this.mouseupHandle.bind(this);
        this.mousemoveHandle = this.mousemoveHandle.bind(this);
        this.mouseoutHandle = this.mouseoutHandle.bind(this);
        this.init();
    }
    public mousedownHandle(event: MouseEvent) {
        event.preventDefault();
        this.operateStart(event.offsetX, event.offsetY);
    }
    public mouseupHandle(event: MouseEvent) {
        event.preventDefault();
        this.operateEnd();
    }
    public mouseoutHandle(event: MouseEvent) {
        event.preventDefault();
        this.operateEnd();
    }
    public mousemoveHandle(event: MouseEvent) {
        event.preventDefault();
        this.operateDrag(
            event.offsetX,
            event.offsetY,
            event.movementX,
            event.movementY
        );
    }
    public init(): void {
        this.domElement.addEventListener("mousedown", this.mousedownHandle);
        this.domElement.addEventListener("mouseup", this.mouseupHandle);
        this.domElement.addEventListener("mousemove", this.mousemoveHandle);
        this.domElement.addEventListener("mouseout", this.mouseoutHandle);
    }
    public dispose(): void {
        this.domElement.removeEventListener("mousedown", this.mousedownHandle);
        this.domElement.removeEventListener("mouseup", this.mouseupHandle);
        this.domElement.removeEventListener("mousemove", this.mousemoveHandle);
        this.domElement.removeEventListener("mouseout", this.mouseoutHandle);
    }
}

/**
 * Touch-based user control for the Rubik's Cube.
 */
export class TouchControl extends Control {
    private lastPos: Vector2 | undefined;
    constructor(
        camera: PerspectiveCamera,
        scene: Scene,
        renderer: WebGLRenderer,
        cube: Cube
    ) {
        super(camera, scene, renderer, cube);
        this.touchStart = this.touchStart.bind(this);
        this.touchMove = this.touchMove.bind(this);
        this.touchEnd = this.touchEnd.bind(this);
        this.init();
    }
    public touchStart(event: TouchEvent) {
        event.preventDefault();
        const touches = event.touches;
        if (touches.length === 1) {
            const touch = touches[0];
            this.lastPos = new Vector2(touch.pageX, touch.pageY);
            this.operateStart(touch.pageX, touch.pageY);
        }
    }
    public touchMove(event: TouchEvent) {
        event.preventDefault();
        const touches = event.touches;
        if (touches.length === 1 && this.lastPos) {
            const touch = touches[0];
            this.operateDrag(
                touch.pageX,
                touch.pageY,
                touch.pageX - this.lastPos.x,
                touch.pageY - this.lastPos.y
            );
            this.lastPos = new Vector2(touch.pageX, touch.pageY);
        }
    }
    public touchEnd(event: TouchEvent) {
        event.preventDefault();
        this.lastPos = undefined;
        this.operateEnd();
    }
    public init(): void {
        this.domElement.addEventListener("touchstart", this.touchStart);
        this.domElement.addEventListener("touchmove", this.touchMove);
        this.domElement.addEventListener("touchend", this.touchEnd);
    }
    public dispose(): void {
        this.domElement.removeEventListener("touchstart", this.touchStart);
        this.domElement.removeEventListener("touchmove", this.touchMove);
        this.domElement.removeEventListener("touchend", this.touchEnd);
    }
}

export default Control;
