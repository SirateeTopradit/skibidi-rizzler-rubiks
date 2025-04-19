import {PerspectiveCamera, Scene, WebGLRenderer, PMREMGenerator, FloatType} from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import createCamera from "./components/camera";
import createScene from "./components/scene";
import createRenderer from "./components/renderer";
import {Cube} from "./core/cube";
import Control, {MouseControl, TouchControl} from "./core/control";
import { setTime, setFinish } from "./core/statusbar";

const setSize = (container: Element, camera: PerspectiveCamera, renderer: WebGLRenderer) => {
    // Set the camera's aspect ratio
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    // update the size of the renderer AND the canvas
    renderer.setSize(container.clientWidth, container.clientHeight);

    // set the pixel ratio (for mobile devices)
    renderer.setPixelRatio(window.devicePixelRatio);
};

class Rubiks {
    private timerId?: number;
    private startTime?: number;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private cube: Cube | undefined;
    private renderer: WebGLRenderer;
    private _controls: Control[] = [];
    public constructor(container: Element) {
        this.camera = createCamera();
        this.scene = createScene("#9e7a68");
        this.renderer = createRenderer();
        // load environment HDR and apply for PBR reflections
        const pmrem = new PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        new RGBELoader()
            .setDataType(FloatType)
            .load(
                'https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr',
                (hdr) => {
                    const envMap = pmrem.fromEquirectangular(hdr).texture;
                    this.scene.environment = envMap;
                    // this.scene.background = envMap;
                    hdr.dispose();
                    pmrem.dispose();
                }
            );
        container.appendChild(this.renderer.domElement);

        // auto resize
        window.addEventListener("resize", () => {
            setSize(container, this.camera, this.renderer);
            this.render();
        });
        setSize(container, this.camera, this.renderer);
        this.setOrder(3);

        this.startAnimation();
    }

    public setOrder(order: number) {
        this.scene.remove(...this.scene.children);
        if (this._controls.length > 0) {
            this._controls.forEach((control) => control.dispose());
        }

        const cube = new Cube(order);
        this.scene.add(cube);
        this.cube = cube;
        this.render();

        const winW = this.renderer.domElement.clientWidth;
        const winH = this.renderer.domElement.clientHeight;
        const coarseSize = cube.getCoarseCubeSize(this.camera, {w: winW, h: winH});

        const ratio = Math.max(2.2 / (winW / coarseSize), 2.2 / (winH / coarseSize));
        this.camera.position.z *= ratio;
        this._controls.push(
            new MouseControl(this.camera, this.scene, this.renderer, cube),
            new TouchControl(this.camera, this.scene, this.renderer, cube)
        );

        this.render();
    }

    /**
     * 打乱
     */
    public disorder() {
        if (this.cube) {
            this.cube.disorder();
            this.render();
            // start timer
            setFinish(false);
            setTime(0);
            this.startTimer();
        }
    }

    /**
     * 还原
     */
    public restore() {
        if (this.cube) {
            this.cube.restore();
            this.render();
            // stop timer and reset display
            if (this.timerId) clearInterval(this.timerId);
            setTime(0);
            setFinish(false);
        } else {
            console.error("RESTORE_ERROR: this.cube is undefined.");
        }
    }

    /**
     * Start the timer interval to update elapsed time and check finish.
     */
    private startTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.startTime = Date.now();
        this.timerId = window.setInterval(() => {
            if (!this.startTime) return;
            const elapsed = (Date.now() - this.startTime) / 1000;
            setTime(elapsed);
            if (this.cube?.finish) {
                clearInterval(this.timerId!);
                setFinish(true); // show finish message when solved
            }
        }, 500);
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    private startAnimation() {
        const animation = (time: number) => {
            time /= 1000; // convert to seconds
            if (this.cube) {
                if (time < 2) {
                    this.cube.position.z = (-1 + time / 2) * 100;
                } else {
                    this.cube.position.z = 0;
                }
            }

            this.render();
            requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    }
}

export default Rubiks;
