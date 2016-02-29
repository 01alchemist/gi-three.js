import {GIRenderBase} from "./GIRenderBase";
import {OBJLoader} from "../src/engine/data/OBJLoader";
import {SpecularMaterial} from "../src/engine/scene/materials/SpecularMaterial";
import {Color} from "../src/engine/math/Color";
import {Camera} from "../src/engine/scene/Camera";
import {SharedScene} from "../src/engine/scene/SharedScene";
import {Cube} from "../src/engine/scene/shapes/Cube";
import {Vector3} from "../src/engine/math/Vector3";
import {DiffuseMaterial} from "../src/engine/scene/materials/DiffuseMaterial";
import {Sphere} from "../src/engine/scene/shapes/Sphere";
import {LightMaterial} from "../src/engine/scene/materials/LightMaterial";
import {NoAttenuation} from "../src/engine/scene/materials/Attenuation";

/**
 * Created by Nidin Vinayakan on 27-02-2016.
 */

export class GIJSView extends GIRenderBase {

    constructor(public width:number, public height:number, public container:HTMLElement) {
        super(width, height, container);

        this.scene = new SharedScene();

        //default ground
        this.scene.add(Cube.newCube(new Vector3(-100, -1, -100), new Vector3(100, 0, 100), new DiffuseMaterial(new Color(1, 1, 1))));
        //lights
        this.scene.add(Sphere.newSphere(new Vector3(5, 5, 0), 1, new LightMaterial(Color.hexColor(0xffeedd), 1, NoAttenuation)));

        this.camera = Camera.lookAt(new Vector3(0, 10, 10), new Vector3(0, 0, 0), new Vector3(0, 1, 0), 45);

        this.cameraSamples = -1;
        this.hitSamples = 4;
        this.bounces = 4;
        this.iterations = 1000000;
        this.blockIterations = 2;
    }

    loadModel(url:string = "../models/teapot.obj", onInit?:Function):void {
        var self = this;
        var loader:OBJLoader = new OBJLoader();
        loader.parentMaterial = new SpecularMaterial(Color.hexColor(0xB9121B), 2);
        loader.load(url, function (_mesh) {
            if (!_mesh) {
                console.log("LoadOBJ error:");
            } else {
                console.log("Obj file loaded");
                //_mesh.smoothNormals();
                self.scene.add(_mesh);
                self.render.call(self, onInit);
            }
        });
    }

    setThreeJSScene(scene) {
        console.log(scene);
    }

    updateCamera(camera:THREE.PerspectiveCamera) {
        //console.log(JSON.stringify(this.camera.toJSON()));
        this.camera.p.setFromJson(camera.position);
        this.camera.m = 1 / Math.tan(camera.fov * Math.PI / 360);
        let e = camera.matrix.elements
        let x = [-e[0], -e[1], -e[2]];
        let y = [e[4], e[5], e[6]];
        let z = [-e[8], -e[9], -e[10]];

        this.camera.u.setFromArray(x);
        this.camera.v.setFromArray(y);
        this.camera.w.setFromArray(z);
        //console.log(JSON.stringify(this.camera.toJSON()));
        this.dirty = true;
        if(this.renderer){
            this.renderer.traceManager.stop();
        }
    }
}
