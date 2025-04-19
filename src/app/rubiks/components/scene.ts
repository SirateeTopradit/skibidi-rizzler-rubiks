import {
    Color,
    Scene,
    ColorRepresentation,
    HemisphereLight,
    DirectionalLight,
} from "three";

const createScene = (bgColor: ColorRepresentation) => {
    const scene = new Scene();

    scene.background = new Color(bgColor);

    const hemi = new HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemi);

    const dir = new DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    return scene;
};

export default createScene;
