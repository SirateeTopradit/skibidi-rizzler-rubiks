import Control, { MouseControl, TouchControl, GyroControl } from "./core/control"; // Import GyroControl
import { PerspectiveCamera, Scene, WebGLRenderer, PMREMGenerator, FloatType } from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import createCamera from "./components/camera";
import createRenderer from "./components/renderer";
import createScene from "./components/scene";
import { Cube } from "./core/cube";
import { setTime, setFinish } from "./core/statusbar";
import confetti from "canvas-confetti";

// add leaderboard entry type definition
type LeaderboardEntry = { time: number; date: string; image: string };

const setSize = (
    container: Element,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer
) => {
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
    private imageUrl?: string;
    private startTime?: number;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private cube: Cube | undefined;
    private renderer: WebGLRenderer;
    private _controls: Control[] = [];
    public constructor(container: Element) {
        this.camera = createCamera();
        this.scene = createScene();
        this.renderer = createRenderer();
        // load environment HDR and apply for PBR reflections
        const pmrem = new PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        new RGBELoader()
            .setDataType(FloatType)
            .load(
                "https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr",
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
        // initialize with saved image so cube loads image without manual reload
        const savedImage = localStorage.getItem('rubiksImage');
        if (savedImage) this.imageUrl = savedImage;
        this.setOrder(3);

        // Initialize controls
        this._controls.push(
            new MouseControl(this.camera, this.scene, this.renderer, this.cube!)
        );
        this._controls.push(
            new TouchControl(this.camera, this.scene, this.renderer, this.cube!)
        );

        // Conditionally add GyroControl based on localStorage setting
        const gyroEnabled = localStorage.getItem("rubiksGyroEnabled") === "true";
        if (gyroEnabled) {
            this.enableGyro(true); // Use a method to handle enabling/disabling
        }

        this.startAnimation();
        this.disorder();
    }

    public setOrder(order: number) {
        this.scene.remove(...this.scene.children);
        if (this._controls.length > 0) {
            this._controls.forEach((control) => control.dispose());
        }

        const cube = new Cube(order, this.imageUrl);
        this.scene.add(cube);
        this.cube = cube;
        this.render();

        // adjust camera based on cube size and renderer dimensions
        const { clientWidth: width, clientHeight: height } = this.renderer.domElement;
        const coarseSize = cube.getCoarseCubeSize(this.camera, { w: width, h: height });
        const ratio = Math.max(
            2.2 / (width / coarseSize),
            2.2 / (height / coarseSize)
        );
        this.camera.position.z *= ratio;

        this.render();
    }

    /**
     * 打乱
     */
    public disorder() {
        if (this.cube) {
            this.cube.scrambleSmart(20);
            this.render();
            // start timer
            setFinish(false);
            setTime(0)
            const waitForFirstRotation = () => {
                if (this.cube?.state.inRotation) {
                    this.startTimer();
                } else {
                    requestAnimationFrame(waitForFirstRotation);
                }
            };
            requestAnimationFrame(waitForFirstRotation);
        }
    }

    public disorder2() {
        if (this.cube) {
            this.cube.scrambleSmartAnimated(20);
            this.render();
            // start timer
            setFinish(false);
            setTime(0);

            const waitForFirstRotation = () => {
                if (this.cube?.state.inRotation) {
                    this.startTimer();
                } else {
                    requestAnimationFrame(waitForFirstRotation);
                }
            };
            requestAnimationFrame(waitForFirstRotation);
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

                // save to leaderboard in localStorage
                const leaderboardKey = "rubiksLeaderboard";
                const savedBoard: LeaderboardEntry[] = JSON.parse(
                    localStorage.getItem(leaderboardKey) || "[]"
                ) as LeaderboardEntry[];
                const imageUrl = localStorage.getItem("rubiksImage") || "";
                savedBoard.push({
                    time: elapsed,
                    date: new Date().toISOString(),
                    image: imageUrl,
                });
                savedBoard.sort((a, b) => a.time - b.time);
                const topBoard: LeaderboardEntry[] = savedBoard.slice(0, 10); // top 10
                localStorage.setItem(leaderboardKey, JSON.stringify(topBoard));

                // celebrate with confetti
                confetti({ particleCount: 500, spread: 200 });
                // congratulations effect and auto reset after solving
                const overlay = document.createElement("div");
                overlay.id = "congrats-overlay";
                overlay.style.cssText =
                    "position:fixed;top:0;left:0;width:100%;height:100%;" +
                    "display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;" +
                    "font-size:1.5rem;color:#fff;padding:2rem;background:rgba(0,0,0,0.5);z-index:1000;";
                // show final elapsed time and best record
                const finalTime =
                    document.getElementById("timer")?.innerText || "";
                // build leaderboard table
                // const rows = topBoard
                //     .map((entry, i) => {
                //         const mins = String(
                //             Math.floor(entry.time / 60)
                //         ).padStart(2, "0");
                //         const secs = String(
                //             Math.floor(entry.time % 60)
                //         ).padStart(2, "0");
                //         const date = new Date(entry.date).toLocaleDateString();
                //         const name = entry.image.split("/").pop() || "Default";
                //         return `<tr><td>${
                //             i + 1
                //         }</td><td>${mins}:${secs}</td><td>${date}</td><td>${name}</td></tr>`;
                //     })
                //     .join("");
                overlay.innerHTML =
                    `🎉 Congratulations! You've solved the cube! 🎉<br/>` +
                    `${finalTime}<br/>`
                document.body.appendChild(overlay);
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    this.restore();
                }, 3000);
            }
        }, 500);
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Entrance animation for the cube
     */
    private startAnimation() {
        const animation = (time: number) => {
            time /= 1000;
            if (this.cube) {
                if (time < 2) {
                    this.cube.position.z = (-1 + time / 2) * 10;
                } else {
                    this.cube.position.z = 0;
                }
            }
            this.render();
            requestAnimationFrame(animation);
        };
        requestAnimationFrame(animation);
    }

    /**
     * Update image texture on squares
     */
    public setImage(imageUrl: string) {
        this.imageUrl = imageUrl;
        // recreate cube with same order
        if (this.cube) {
            this.setOrder(this.cube.order);
        }
    }

    /**
     * Enable or disable Gyroscope control.
     */
    public enableGyro(enable: boolean) {
        const existingGyro = this._controls.find(c => c instanceof GyroControl);
        if (enable && !existingGyro) {
            const gyroControl = new GyroControl(this.camera, this.scene, this.renderer, this.cube!);
            this._controls.push(gyroControl);
            console.log("Gyro enabled");
        } else if (!enable && existingGyro) {
            existingGyro.dispose();
            this._controls = this._controls.filter(c => !(c instanceof GyroControl));
            console.log("Gyro disabled");
        }
    }
}

export default Rubiks;
