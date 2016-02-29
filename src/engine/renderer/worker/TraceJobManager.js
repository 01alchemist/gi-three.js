System.register(["./ThreadPool"], function(exports_1) {
    var ThreadPool_1;
    var TraceJobManager;
    return {
        setters:[
            function (ThreadPool_1_1) {
                ThreadPool_1 = ThreadPool_1_1;
            }],
        execute: function() {
            TraceJobManager = (function () {
                function TraceJobManager() {
                    this.iterations = 0;
                    this.initCount = 0;
                    this.maxLoop = 1;
                    this.currentLoop = 0;
                    this.totalThreads = 0;
                    this.queue = [];
                    this.deferredQueue = [];
                    this.referenceQueue = [];
                }
                Object.defineProperty(TraceJobManager.prototype, "initialized", {
                    get: function () {
                        return this._initialized;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TraceJobManager.prototype, "finished", {
                    get: function () {
                        return this._finished;
                    },
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(TraceJobManager.prototype, "pixels", {
                    get: function () {
                        return this.pixelMemory;
                    },
                    enumerable: true,
                    configurable: true
                });
                TraceJobManager.prototype.configure = function (param, scene) {
                    console.log("configure");
                    this.width = param.width;
                    this.height = param.height;
                    this.sceneMemory = scene.getMemory();
                    this.flags = new Uint8Array(this.sceneMemory.data.buffer, 0, 3);
                    this.pixelMemory = new Uint8Array(new SharedArrayBuffer(this.width * this.height * 3));
                    this.sampleMemory = new Float32Array(new SharedArrayBuffer(4 * this.width * this.height * 3));
                    this.traceParameters = {
                        pixelBuffer: this.pixelMemory.buffer,
                        sampleBuffer: this.sampleMemory.buffer,
                        sceneBuffer: this.sceneMemory.buffer,
                        camera: param.camera,
                        cameraSamples: param.cameraSamples,
                        hitSamples: param.hitSamples,
                        bounces: param.bounces,
                        full_width: this.width,
                        full_height: this.height
                    };
                };
                TraceJobManager.prototype.add = function (job) {
                    this.queue.push(job);
                    this.referenceQueue.push(job);
                };
                TraceJobManager.prototype.init = function (callback) {
                    console.time("init");
                    this.threads = ThreadPool_1.ThreadPool.getThreads();
                    this.totalThreads = this.threads.length;
                    this.initNext(callback);
                };
                TraceJobManager.prototype.initNext = function (callback) {
                    var self = this;
                    if (this.initCount == this.totalThreads) {
                        this._initialized = true;
                        console.timeEnd("init");
                        if (callback) {
                            callback();
                        }
                        else {
                            this.start();
                        }
                        return;
                    }
                    this.threads[this.initCount++].init(this.traceParameters, [
                        this.traceParameters.pixelBuffer,
                        this.traceParameters.sampleBuffer,
                        this.traceParameters.sceneBuffer
                    ], function () {
                        self.initNext.bind(self)(callback);
                    });
                };
                TraceJobManager.prototype.pause = function () {
                    this.flags[0] = 1;
                    this._await = true;
                    var thread;
                    for (var i = 0; i < this.threads.length; i++) {
                        thread = this.threads[i];
                        thread.terminate();
                    }
                };
                TraceJobManager.prototype.resume = function () {
                    this.flags[0] = 0;
                    this._await = false;
                    this.start();
                };
                TraceJobManager.prototype.stop = function () {
                    this.flags[0] = 1;
                    this._await = true;
                    var thread;
                    var job;
                    for (var i = 0; i < this.threads.length; i++) {
                        thread = this.threads[i];
                        thread.terminate();
                    }
                    for (i = 0; i < this.referenceQueue.length; i++) {
                        job = this.referenceQueue[i];
                        job.runCount = 0;
                    }
                };
                TraceJobManager.prototype.clear = function () {
                    for (var y = 0; y < this.height; y++) {
                        for (var x = 0; x < this.width; x++) {
                            var si = (y * (this.width * 3)) + (x * 3);
                            this.pixelMemory[si] = 0;
                            this.pixelMemory[si + 1] = 0;
                            this.pixelMemory[si + 2] = 0;
                            this.sampleMemory[si] = 0;
                            this.sampleMemory[si + 1] = 0;
                            this.sampleMemory[si + 2] = 0;
                        }
                    }
                    if (this.updatePixels) {
                        this.updatePixels({
                            xoffset: 0,
                            yoffset: 0,
                            width: this.width,
                            height: this.height,
                            pixels: this.pixelMemory
                        });
                    }
                };
                TraceJobManager.prototype.restart = function () {
                    this.flags[0] = 0;
                    this.queue = null;
                    this.deferredQueue = null;
                    this.queue = this.referenceQueue.concat();
                    this.deferredQueue = [];
                    this._await = false;
                    this.start();
                };
                TraceJobManager.prototype.isAllThreadsFree = function () {
                    var thread;
                    for (var i = 0; i < this.threads.length; i++) {
                        thread = this.threads[i];
                        if (thread.isTracing) {
                            return false;
                        }
                    }
                    return true;
                };
                TraceJobManager.prototype.start = function () {
                    if (this.currentLoop >= this.maxLoop || (this.queue.length == 0 && this.deferredQueue.length === 0)) {
                        console.log("Rendering finished");
                        return;
                    }
                    console.log("queue:" + this.queue.length);
                    console.time('trace::start');
                    var self = this;
                    if (this._initialized) {
                        var thread;
                        var job;
                        for (var i = 0; i < this.threads.length; i++) {
                            thread = this.threads[i];
                            if (self.queue.length > 0) {
                                job = self.queue.shift();
                                self.deferredQueue.push(job);
                                job.start(thread, function (_job, _thread) {
                                    if (!self._await) {
                                        self.processQueue.call(self, _job, _thread);
                                    }
                                });
                            }
                            else {
                                break;
                            }
                        }
                    }
                };
                TraceJobManager.prototype.processQueue = function (job, thread) {
                    if (this.updatePixels) {
                        this.updatePixels(job.param);
                    }
                    if (this._finished) {
                        return;
                    }
                    var self = this;
                    if (this.queue.length > 0) {
                        var job = self.queue.shift();
                        self.deferredQueue.push(job);
                        job.start(thread, function (_job, _thread) {
                            if (!self._await) {
                                self.processQueue.call(self, _job, _thread);
                            }
                        });
                    }
                    else {
                        if (this.isAllThreadsFree()) {
                            this._finished = true;
                            console.timeEnd('trace::start');
                            this.initDeferredQueue();
                        }
                    }
                };
                TraceJobManager.prototype.initDeferredQueue = function () {
                    if (this.currentLoop >= this.maxLoop || (this.queue.length == 0 && this.deferredQueue.length === 0)) {
                        console.log("Rendering finished");
                        return;
                    }
                    this.currentLoop++;
                    this._finished = false;
                    var self = this;
                    self.deferredQueue.sort(function (a, b) {
                        return b.time - a.time;
                    });
                    console.log("Trace time");
                    console.log("   min:" + self.deferredQueue[self.deferredQueue.length - 1].time);
                    console.log("   max:" + self.deferredQueue[0].time);
                    self.queue = self.deferredQueue;
                    self.deferredQueue = [];
                    console.time('trace::start');
                    this.start();
                };
                return TraceJobManager;
            })();
            exports_1("TraceJobManager", TraceJobManager);
        }
    }
});
//# sourceMappingURL=TraceJobManager.js.map