System.register(["./TraceWorker"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var TraceWorker_1;
    var Thread;
    return {
        setters:[
            function (TraceWorker_1_1) {
                TraceWorker_1 = TraceWorker_1_1;
            }],
        execute: function() {
            Thread = (function () {
                function Thread(name, id) {
                    this.id = id;
                    this.instance = new Worker("../worker-bootstrap.js");
                    var self = this;
                    this.instance.onmessage = function (event) {
                        if (event.data == TraceWorker_1.TraceWorker.INITED) {
                            self.initialized = true;
                            self.isTracing = false;
                            if (self.onInitComplete) {
                                self.onInitComplete(self);
                            }
                        }
                        if (event.data == TraceWorker_1.TraceWorker.TRACED) {
                            self.isTracing = false;
                            if (self.onTraceComplete) {
                                self.onTraceComplete(self);
                            }
                        }
                    };
                }
                Thread.prototype.init = function (param, transferable, onInit) {
                    this.onInitComplete = onInit;
                    param.command = TraceWorker_1.TraceWorker.INIT;
                    param.id = this.id;
                    this.send(param, transferable);
                };
                Thread.prototype.trace = function (param, onComplete) {
                    this.onTraceComplete = onComplete;
                    this.isTracing = true;
                    param.command = TraceWorker_1.TraceWorker.TRACE;
                    this.send(param);
                };
                Thread.prototype.send = function (data, buffers) {
                    this.instance.postMessage(data, buffers);
                };
                Thread.prototype.terminate = function () {
                    this.isTracing = false;
                };
                return Thread;
            }());
            exports_1("Thread", Thread);
        }
    }
});
//# sourceMappingURL=Thread.js.map