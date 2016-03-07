import {ByteArray} from "xdata/core";
import MeshBasicMaterial = THREE.MeshBasicMaterial;
import {HttpLoader} from "./HttpLoader";
import {glTFPipe} from "./glTFPipe";
/**
 * Created by Nidin Vinayakan on 01-03-2016.
 */
export interface IGeometry {
    positions:Float32Array;
    indices:Int32Array;
    normals:Float32Array;
    texCoords:Float32Array;
}
export class glTFLoader {

    static instance:glTFLoader;

    static getInstance():glTFLoader {
        if (!glTFLoader.instance) {
            glTFLoader.instance = new glTFLoader();
        }
        return glTFLoader.instance;
    }

    private httpLoader:HttpLoader;
    private gltf:any;

    constructor() {
        this.httpLoader = new HttpLoader();
    }

    load(url, onComplete:Function, onError?:Function) {
        this.httpLoader.load(url, (response) => {
            glTFPipe(response).then(
                (gltf:any) => {
                    this.gltf = gltf;
                    var root:THREE.Object3D = this.loadChildren(gltf.hierarchy[0]);
                    onComplete(root);
                }
            )
        });
    }

    private loadChildren(obj, parent?):THREE.Object3D {

        parent = parent || new THREE.Object3D();

        if (obj.children.length > 0) {
            for (var i = 0; i < obj.children.length; i++) {
                var child = obj.children[i];

                if (child.geometries) {
                    for (var j = 0; j < child.geometries.length; j++) {
                        var material = new MeshBasicMaterial({color: 0xffffff});
                        var geometryIndex:number = child.geometries[j];
                        var geometry:IGeometry = this.gltf.geometryList[geometryIndex];
                        var bufferGeo:THREE.BufferGeometry = this.buildBufferGeometry(geometry);
                        var mesh = new THREE.Mesh(bufferGeo, material);
                        mesh.name = child.name;
                        parent.add(mesh);
                    }
                } else if (child.children.length > 0) {
                    var node = new THREE.Object3D();
                    node.name = child.name;
                    parent.add(node);
                    this.loadChildren(child, node);
                }
            }
        }
        return parent;
    }

    private buildBufferGeometry(geo:IGeometry):THREE.BufferGeometry {
        var bufferGeo = new THREE.BufferGeometry();

        bufferGeo.addAttribute('position', new THREE.BufferAttribute(geo.positions, 3));
        //bufferGeo.setIndex(new THREE.BufferAttribute(geo.indices, 1));
        bufferGeo.addAttribute("index", new THREE.BufferAttribute(geo.indices, 1));

        if (geo.normals !== undefined) {
            bufferGeo.addAttribute('normal', new THREE.BufferAttribute(geo.normals, 3));
        }

        if (geo.texCoords !== undefined) {
            bufferGeo.addAttribute('uv', new THREE.BufferAttribute(geo.texCoords, 2));
        }

        bufferGeo.computeOffsets();
        bufferGeo.computeBoundingSphere();
        bufferGeo.computeBoundingBox();
        return bufferGeo;
    }
}