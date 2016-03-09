import {arrayBuffer} from "./Request";
import {LZMAPipe} from "./LZMAPipe";
/**
 * Created by marc on 7/26/15.
 */
export class HttpLoader {

    constructor() {
    }

    public load(url:string, callback:Function) {

        var extension = url.split('.').pop().toLowerCase();

        var arrayBufferResponse = window.fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/octet-stream',
                    'Content-Type': 'application/octet-stream'
                }
            })
            .then(status)
            .then(arrayBuffer);

        switch (extension) {

            case 'lzma':

                arrayBufferResponse.then(LZMAPipe)
                    .then((arrayBuffer) => {
                        if (callback) {
                            callback(arrayBuffer);
                        }
                    })
                    .catch((error) => {
                        console.log(error.message);
                    });

                break;

            default:

                arrayBufferResponse.then((arrayBuffer) => {
                        if (callback) {
                            callback(arrayBuffer);
                        }
                    })
                    .catch((error) => {
                        console.log(error.message);
                    });

                break;

        }

    }
}