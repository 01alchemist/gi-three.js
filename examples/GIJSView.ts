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
import {Shape} from "../src/engine/scene/shapes/Shape";
import {ThreeObjects} from "./ThreeObjects";
import {Mesh} from "../src/engine/scene/shapes/Mesh";
import {Triangle} from "../src/engine/scene/shapes/Triangle";
import {Material} from "../src/engine/scene/materials/Material";
import {TransformedShape} from "../src/engine/scene/shapes/TransformedShape";
import {Matrix4} from "../src/engine/math/Matrix4";

/**
 * Created by Nidin Vinayakan on 27-02-2016.
 */

export class GIJSView extends GIRenderBase {

    constructor(public width:number, public height:number, public container:HTMLElement) {
        super(width, height, container);

        this.scene = new SharedScene();

        //default ground
        //this.scene.add(Cube.newCube(new Vector3(-100, -1, -100), new Vector3(100, 0, 100), new DiffuseMaterial(new Color(1, 1, 1))));
        //lights
        this.scene.add(Sphere.newSphere(new Vector3(5, 5, 0), 1, new LightMaterial(Color.hexColor(0xffeedd), 1, NoAttenuation)));

        this.camera = Camera.lookAt(new Vector3(0, 10, 10), new Vector3(0, 0, 0), new Vector3(0, 1, 0), 45);

        this.cameraSamples = -1;
        this.hitSamples = 1;
        this.bounces = 4;
        this.iterations = 1000000;
        this.blockIterations = 1;
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

    setThreeJSScene(scene, onInit?:Function) {
        console.log(scene);
        this.loadChildren(scene);
        this.render(onInit);
    }

    private loadChildren(parent) {
        var child;
        for (var i:number = 0; i < parent.children.length; i++) {
            child = parent.children[i];

            var obj:Shape = this.buildSceneObject(child);
            if (obj) {
                this.scene.add(obj);
            }
            if (child.children.length > 0) {
                this.loadChildren(child);
            }
        }
    }

    private buildSceneObject(src):Shape {

        switch (src.type) {
            case ThreeObjects.Mesh:
                var material = new DiffuseMaterial(Color.hexColor(src.material.color.getHex()));
                material.ior = src.material.ior?src.material.ior:1;
                var shape:Shape = this.buildGeometry(src.geometry, material);
                var mat:Matrix4 = Matrix4.fromTHREEJS(src.matrix.elements);
                return TransformedShape.newTransformedShape(shape, mat);
                break;
        }

        return null;
    }

    private buildGeometry(geometry:THREE.BufferGeometry, material:Material):Shape {

        if(geometry._bufferGeometry){
            geometry = geometry._bufferGeometry;
        }

        var normals:Float32Array = geometry.attributes.normal.array;
        var positions:Float32Array = geometry.attributes.position.array;

        var triangles:Triangle[] = [];
        for (var i = 0; i < positions.length; i = i + 9) {
            var triangle = new Triangle();
            triangle.material = material;
            triangle.v1 = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
            triangle.v2 = new Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
            triangle.v3 = new Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);
            triangle.n1 = new Vector3(normals[i], normals[i + 1], normals[i + 2]);
            triangle.n2 = new Vector3(normals[i + 3], normals[i + 4], normals[i + 5]);
            triangle.n3 = new Vector3(normals[i + 6], normals[i + 7], normals[i + 8]);
            triangle.updateBox();
            triangle.fixNormals();
            triangles.push(triangle);
        }

        var mesh:Mesh = Mesh.newMesh(triangles);
        return mesh;
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
        if (this.renderer) {
            this.renderer.traceManager.stop();
        }
    }
}
