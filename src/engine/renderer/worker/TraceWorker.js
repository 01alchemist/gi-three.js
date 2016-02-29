System.register(["../../scene/Camera", "../../math/Color", "../Renderer", "../../scene/SharedScene", "../../../pointer/DirectMemory"], function(exports_1) {
    var Camera_1, Color_1, Renderer_1, SharedScene_1, DirectMemory_1;
    var TraceWorker;
    return {
        setters:[
            function (Camera_1_1) {
                Camera_1 = Camera_1_1;
            },
            function (Color_1_1) {
                Color_1 = Color_1_1;
            },
            function (Renderer_1_1) {
                Renderer_1 = Renderer_1_1;
            },
            function (SharedScene_1_1) {
                SharedScene_1 = SharedScene_1_1;
            },
            function (DirectMemory_1_1) {
                DirectMemory_1 = DirectMemory_1_1;
            }],
        execute: function() {
            TraceWorker = (function () {
                function TraceWorker() {
                    var _this = this;
                    this.iterations = 1;
                    this.locked = false;
                    var self = this;
                    addEventListener('message', function (e) {
                        var data = e.data;
                        switch (data.command) {
                            case TraceWorker.INIT:
                                self.id = e.data.id;
                                self.pixelMemory = new Uint8ClampedArray(e.data.pixelBuffer);
                                self.sampleMemory = new Float32Array(e.data.sampleBuffer);
                                self.sceneMemory = new DirectMemory_1.DirectMemory(e.data.sceneBuffer);
                                if (!self.camera) {
                                    self.camera = Camera_1.Camera.fromJson(e.data.camera);
                                }
                                if (!self.scene) {
                                    self.flags = new Uint8Array(self.sceneMemory.data.buffer, 0, 3);
                                    self.scene = SharedScene_1.SharedScene.getScene(self.sceneMemory);
                                }
                                self.full_width = e.data.full_width;
                                self.full_height = e.data.full_height;
                                self.cameraSamples = e.data.cameraSamples;
                                self.hitSamples = e.data.hitSamples;
                                self.bounces = e.data.bounces;
                                postMessage(TraceWorker.INITED);
                                break;
                            case TraceWorker.TRACE:
                                if (_this.flags[0] === 1) {
                                    console.log("exit:1");
                                    self.locked = true;
                                    return;
                                }
                                self.init(e.data.width, e.data.height, e.data.xoffset, e.data.yoffset);
                                self.cameraSamples = e.data.cameraSamples || self.cameraSamples;
                                self.hitSamples = e.data.hitSamples || self.hitSamples;
                                if (e.data.camera) {
                                    self.camera.updateFromJson(e.data.camera);
                                }
                                self.iterations = e.data.init_iterations || 0;
                                if (self.locked) {
                                    console.log("restarted:" + self.iterations, "samples:" + self.checkSamples());
                                    self.locked = false;
                                }
                                if (self.iterations > 0 && e.data.blockIterations) {
                                    for (var i = 0; i < e.data.blockIterations; i++) {
                                        if (_this.flags[0] === 1) {
                                            return;
                                        }
                                        self.run();
                                    }
                                }
                                else {
                                    self.run();
                                }
                                if (_this.flags[0] === 1) {
                                    return;
                                }
                                postMessage(TraceWorker.TRACED);
                                break;
                        }
                    }, false);
                }
                TraceWorker.prototype.init = function (width, height, xoffset, yoffset) {
                    this.width = width;
                    this.height = height;
                    this.xoffset = xoffset;
                    this.yoffset = yoffset;
                    this.absCameraSamples = Math.round(Math.abs(this.cameraSamples));
                };
                TraceWorker.prototype.run = function () {
                    this.iterations++;
                    var hitSamples = this.hitSamples;
                    var cameraSamples = this.cameraSamples;
                    var absCameraSamples = this.absCameraSamples;
                    if (this.iterations == 1) {
                        hitSamples = 1;
                        cameraSamples = -1;
                        absCameraSamples = Math.round(Math.abs(cameraSamples));
                    }
                    for (var y = this.yoffset; y < this.yoffset + this.height; y++) {
                        for (var x = this.xoffset; x < this.xoffset + this.width; x++) {
                            if (this.flags[0] === 1) {
                                console.log("exit:3");
                                this.locked = true;
                                return;
                            }
                            var screen_index = (y * (this.full_width * 3)) + (x * 3);
                            var _x = x - this.xoffset;
                            var _y = y - this.yoffset;
                            var c = new Color_1.Color();
                            if (cameraSamples <= 0) {
                                for (var i = 0; i < absCameraSamples; i++) {
                                    var fu = Math.random();
                                    var fv = Math.random();
                                    var ray = this.camera.castRay(x, y, this.full_width, this.full_height, fu, fv);
                                    c = c.add(this.scene.sample(ray, true, hitSamples, this.bounces));
                                }
                                c = c.divScalar(absCameraSamples);
                            }
                            else {
                                var n = Math.round(Math.sqrt(cameraSamples));
                                for (var u = 0; u < n; u++) {
                                    for (var v = 0; v < n; v++) {
                                        var fu = (u + 0.5) / n;
                                        var fv = (v + 0.5) / n;
                                        var ray = this.camera.castRay(x, y, this.full_width, this.full_height, fu, fv);
                                        c = c.add(this.scene.sample(ray, true, hitSamples, this.bounces));
                                    }
                                }
                                c = c.divScalar(n * n);
                            }
                            if (this.flags[0] === 1) {
                                console.log("exit:7");
                                this.locked = true;
                                return;
                            }
                            c = c.pow(1 / 2.2);
                            this.updatePixel(c, screen_index);
                            if (Renderer_1.Renderer.DEBUG && x == this.xoffset || Renderer_1.Renderer.DEBUG && y == this.yoffset) {
                                this.drawPixelInt(screen_index, 0xFFFF00F);
                            }
                        }
                    }
                };
                TraceWorker.prototype.updatePixel = function (color, si) {
                    if (this.flags[0] === 1) {
                        console.log("exit:8");
                        this.locked = true;
                        return;
                    }
                    this.sampleMemory[si] += color.r;
                    this.sampleMemory[si + 1] += color.g;
                    this.sampleMemory[si + 2] += color.b;
                    this.pixelMemory[si] = Math.max(0, Math.min(255, (this.sampleMemory[si] / this.iterations) * 255));
                    this.pixelMemory[si + 1] = Math.max(0, Math.min(255, (this.sampleMemory[si + 1] / this.iterations) * 255));
                    this.pixelMemory[si + 2] = Math.max(0, Math.min(255, (this.sampleMemory[si + 2] / this.iterations) * 255));
                };
                TraceWorker.prototype.checkSamples = function () {
                    for (var y = this.yoffset; y < this.yoffset + this.height; y++) {
                        for (var x = this.xoffset; x < this.xoffset + this.width; x++) {
                            var si = (y * (this.full_width * 3)) + (x * 3);
                            if (this.sampleMemory[si] !== 0 &&
                                this.sampleMemory[si + 1] !== 0 &&
                                this.sampleMemory[si + 2] !== 0) {
                                return "NOT_OK";
                            }
                        }
                    }
                    return "OK";
                };
                TraceWorker.prototype.drawColor = function (i, rgba) {
                    this.pixelMemory[i] = rgba.r;
                    this.pixelMemory[i + 1] = rgba.g;
                    this.pixelMemory[i + 2] = rgba.b;
                };
                TraceWorker.prototype.drawPixelInt = function (i, color) {
                    var red = (color >> 16) & 255;
                    var green = (color >> 8) & 255;
                    var blue = color & 255;
                    this.pixelMemory[i] = red;
                    this.pixelMemory[i + 1] = green;
                    this.pixelMemory[i + 2] = blue;
                };
                TraceWorker.INIT = "INIT";
                TraceWorker.INITED = "INITED";
                TraceWorker.TRACE = "TRACE";
                TraceWorker.TRACED = "TRACED";
                TraceWorker.TERMINATE = "TERMINATE";
                return TraceWorker;
            })();
            exports_1("TraceWorker", TraceWorker);
            new TraceWorker();
        }
    }
});
//# sourceMappingURL=TraceWorker.js.map