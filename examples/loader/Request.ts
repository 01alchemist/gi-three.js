export function status(response) {
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
    }
    return response.text().then(function(text) {
        throw new Error(text);
    });
}

export function text(response) {
    return response.text();
}

export function json(response) {
    return response.json();
}

export function xml(response) {
    var parser = new DOMParser();
    return response.text().then(function(text) {
        return parser.parseFromString(text,"application/xml");
    });
}
export function arrayBuffer(response) {
    return response.arrayBuffer();
}