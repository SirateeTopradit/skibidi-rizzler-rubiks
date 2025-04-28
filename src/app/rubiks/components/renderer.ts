import { WebGLRenderer } from "three";

const createRenderer = () => {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    // basic renderer settings; environment map provides PBR lighting
    renderer.setClearAlpha(0);

    return renderer;
};

export default createRenderer;
