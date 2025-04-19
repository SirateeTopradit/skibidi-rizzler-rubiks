import { WebGLRenderer } from "three";

const createRenderer = () => {
    const renderer = new WebGLRenderer({ antialias: true });
    // basic renderer settings; environment map provides PBR lighting

    return renderer;
};

export default createRenderer;
