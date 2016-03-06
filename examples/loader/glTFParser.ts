import {ByteArray} from "xdata/core";
/**
 * Created by Nidin Vinayakan on 01-03-2016.
 */
export interface IGeometry {
    positions:Float32Array;
    indices:Int32Array;
    normals:Float32Array;
    texCoords:Float32Array;
}
export class glTFParser {

    static instance:glTFParser;

    static getInstance():glTFParser {
        if (!glTFParser.instance) {
            glTFParser.instance = new glTFParser();
        }
        return glTFParser.instance;
    }

    constructor() {

    }

    parse(dataBuffer, spec?):{hierarchy: any, geometryList: IGeometry[]} {
        var geometryList:IGeometry[] = [];
        var data:ByteArray = new ByteArray(dataBuffer);
        var geometryLength = data.readUnsignedInt();
        var geometry:IGeometry;

        console.log("geometryLength:" + geometryLength);

        for (var i:number = 0; i < geometryLength; i++) {
            geometry = this.parseGeometry(data);
            console.log("geometry:" + geometry);
            if (geometry) {
                geometryList.push(geometry);
            }
        }

        var hierarchyStrLen = data.readUnsignedInt();
        var hierarchyStr = data.readUTFBytes(hierarchyStrLen);
        var hierarchy = JSON.parse(hierarchyStr);

        return {
            hierarchy: hierarchy,
            geometryList: geometryList
        }
    }

    private parseGeometry(data:ByteArray):IGeometry {

        var length:number = data.readUnsignedInt();
        var positions:Float32Array = data.readFloat32Array(length, true);
        length = data.readUnsignedInt();
        var indices:Int32Array = data.readInt32Array(length, true);
        length = data.readUnsignedInt();
        var normals:Float32Array = data.readFloat32Array(length, true);
        length = data.readUnsignedInt();
        if (length > 0) {
            var texCoords:Float32Array = data.readFloat32Array(length, true);
        }
        return {
            positions: positions,
            indices: indices,
            normals: normals,
            texCoords: texCoords
        }
    }
}