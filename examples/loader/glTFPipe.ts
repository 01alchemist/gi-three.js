import {glTFParser} from "../parser/glTFParser";
/**
 * Created by Nidin Vinayakan on 05-03-2016.
 */
export function glTFPipe(arrayBuffer:ArrayBuffer) {
    return new Promise(function (resolve, reject) {
        try {
            resolve(glTFParser.getInstance().parse(arrayBuffer));
        } catch (e) {
            reject(e);
        }
    });
}
