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
import {TransparentMaterial} from "../src/engine/scene/materials/TransparentMaterial";
import {Attenuation} from "../src/engine/scene/materials/Attenuation";
import {LinearAttenuation} from "../src/engine/scene/materials/Attenuation";

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
        //this.scene.add(Sphere.newSphere(new Vector3(5, 5, 0), 1, new LightMaterial(Color.hexColor(0xffeedd), 0.1, NoAttenuation)));

        this.camera = Camera.lookAt(new Vector3(0, 10, 10), new Vector3(0, 0, 0), new Vector3(0, 1, 0), 45);

        this.cameraSamples = -1;
        this.hitSamples = 1;
        this.bounces = 4;
        this.iterations = 1000000;
        this.blockIterations = 1;
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

                if (!(obj.getMaterial(new Vector3()) instanceof LightMaterial)) {
                    if (child.children.length > 0) {
                        this.loadChildren(child);
                    }
                }
            }
            if (child.children.length > 0) {
                this.loadChildren(child);
            }
        }
    }

    private buildSceneObject(src):Shape {

        switch (src.type) {
            case ThreeObjects.Mesh:
                var material = GIJSView.getMaterial(src.material);
                var shape:Shape = this.buildGeometry(src.geometry, material);
                var mat:Matrix4 = Matrix4.fromTHREEJS(src.matrix.elements);
                return TransformedShape.newTransformedShape(shape, mat);

            case ThreeObjects.PointLight:
                return this.getLight(src);

        }

        return null;
    }

    private buildGeometry(geometry:THREE.BufferGeometry, material:Material):Shape {

        if (geometry._bufferGeometry) {
            geometry = geometry._bufferGeometry;
        }

        var normals:Float32Array = geometry.attributes["normal"].array;
        var positions:Float32Array = geometry.attributes["position"].array;
        var triangles:Triangle[] = [];
        var triCount:number = 0;
        var indexAttribute = geometry.getIndex();

        if (indexAttribute) {

            var indices = indexAttribute.array;

            for (var i = 0; i < indices.length; i = i + 3) {
                var a;
                var b;
                var c;

                a = indices[i];
                 b = indices[i + 1];
                 c = indices[i + 2];

                /*if (++triCount % 2 !== 0) {
                    a = indices[i];
                    b = indices[i + 1];
                    c = indices[i + 2];
                } else {
                    c = indices[i];
                    b = indices[i + 1];
                    a = indices[i + 2];
                }*/

                //[....,ax,ay,az, bx,by,bz, cx,xy,xz,....]
                var ax = a * 3;
                var ay = (a * 3) + 1;
                var az = (a * 3) + 2;

                var bx = b * 3;
                var by = (b * 3) + 1;
                var bz = (b * 3) + 2;

                var cx = c * 3;
                var cy = (c * 3) + 1;
                var cz = (c * 3) + 2;

                var triangle = new Triangle();
                triangle.material = material;
                triangle.v1 = new Vector3(positions[ax], positions[ay], positions[az]);
                triangle.v2 = new Vector3(positions[bx], positions[by], positions[bz]);
                triangle.v3 = new Vector3(positions[cx], positions[cy], positions[cz]);

                /*if (++triCount % 2 === 0) {
                 triangle.n1 = new Vector3(-normals[ax], -normals[ay], -normals[az]);
                 triangle.n2 = new Vector3(-normals[bx], -normals[by], -normals[bz]);
                 triangle.n3 = new Vector3(-normals[cx], -normals[cy], -normals[cz]);
                 } else {*/
                triangle.n1 = new Vector3(normals[ax], normals[ay], normals[az]);
                triangle.n2 = new Vector3(normals[bx], normals[by], normals[bz]);
                triangle.n3 = new Vector3(normals[cx], normals[cy], normals[cz]);
                //}

                triangle.updateBox();
                triangle.fixNormals();
                triangles.push(triangle);
            }

        } else {
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
        }
        var mesh:Mesh = Mesh.newMesh(triangles);
        mesh.smoothNormals();
        return mesh;
    }

    updateCamera(camera:THREE.PerspectiveCamera) {
        //console.log(JSON.stringify(this.camera.toJSON()));
        this.camera.p.setFromJson(camera.position);
        this.camera.m = 1 / Math.tan(camera.fov * Math.PI / 360);
        let e = camera.matrix.elements;
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

    private static getMaterial(srcMaterial:THREE.Material):Material {
        var material:Material = new DiffuseMaterial(Color.hexColor(srcMaterial.color.getHex()));
        //var material:Material = new Material(Color.hexColor(srcMaterial.color.getHex()));
        //material.ior = srcMaterial.ior ? srcMaterial.ior : 1;
        //material.tint = srcMaterial.tint?srcMaterial.tint:0;
        //material.gloss = srcMaterial.gloss?srcMaterial.gloss:0;
        //material.emittance = srcMaterial.emittance?srcMaterial.emittance:0;
        //material.transparent = srcMaterial.transparent;
        //material.attenuation = Attenuation.fromJson(srcMaterial.attenuation);
        return material;
    }

    private getLight(src:any):Shape {
        var material = new LightMaterial(Color.hexColor(src.color.getHex()), src.intensity, new LinearAttenuation(src.distance));
        var mat:Matrix4 = Matrix4.fromTHREEJS(src.matrix.elements);
        var sphere = Sphere.newSphere(new Vector3(src.position.x, src.position.y, -src.position.z), 1, material);
        //this.scene.add(TransformedShape.newTransformedShape(sphere, mat));
        this.scene.add(sphere);
        return null;
    }
}
