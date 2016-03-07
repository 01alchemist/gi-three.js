import {LZMAHelper} from "xdata/helpers";
/**
 * Created by Nidin Vinayakan on 05-03-2016.
 */

export function LZMAPipe(data:ArrayBuffer) {
    return new Promise(function (resolve, reject) {
        try {
            LZMAHelper.decodeAsync(data, function(result){
                resolve(result);
            })
        } catch (e) {
            reject(e);
        }
    });
}