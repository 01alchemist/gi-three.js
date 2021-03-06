System.register(["./CanvasDisplay", "../src/engine/renderer/SmartBucketRenderer"], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var CanvasDisplay_1, SmartBucketRenderer_1;
    var GIRenderBase;
    return {
        setters:[
            function (CanvasDisplay_1_1) {
                CanvasDisplay_1 = CanvasDisplay_1_1;
            },
            function (SmartBucketRenderer_1_1) {
                SmartBucketRenderer_1 = SmartBucketRenderer_1_1;
            }],
        execute: function() {
            GIRenderBase = (function (_super) {
                __extends(GIRenderBase, _super);
                function GIRenderBase(i_width, i_height, container) {
                    _super.call(this, i_width, i_height, container);
                }
                GIRenderBase.prototype.updateCameraSamples = function (newValue) {
                    if (this.cameraSamples != newValue) {
                        this.cameraSamples = newValue;
                        this.renderer.updateCameraSamples(newValue);
                    }
                };
                GIRenderBase.prototype.updateHitSamples = function (newValue) {
                    if (this.hitSamples != newValue) {
                        this.hitSamples = newValue;
                        this.renderer.updateHitSamples(newValue);
                    }
                };
                GIRenderBase.prototype.updateCamera = function (newValue) {
                    this.camera.updateFromArray(newValue.eye, newValue.lookAt, newValue.up, newValue.fov, newValue.focus, newValue.aperture);
                    this.renderer.updateCamera(this.camera.toJSON());
                };
                GIRenderBase.prototype.updateCameraMatrix = function (matrix) {
                    this.camera.u.setFromArray(matrix, 0);
                    this.camera.v.setFromArray(matrix, 4);
                    this.camera.w.setFromArray(matrix, 8);
                    this.renderer.updateCamera(this.camera.toJSON());
                };
                GIRenderBase.prototype.toggleTrace = function (newValue) {
                    if (this.renderer.initialized) {
                        if (newValue) {
                            var cam = this.camera.toJSON();
                            this.dirty = false;
                            this.renderer.updateCamera(cam);
                        }
                        else {
                            this.renderer.traceManager.stop();
                        }
                    }
                };
                GIRenderBase.prototype.render = function (onInit) {
                    console.info("+ Render settings");
                    console.info("      Resolution          :   " + this.i_width + "x" + this.i_height);
                    console.info("      CameraSamples       :   " + this.cameraSamples);
                    console.info("      HitSamples          :   " + this.hitSamples);
                    console.info("      Bounces             :   " + this.bounces);
                    console.info("      Iterations          :   " + this.iterations);
                    console.info("      Block-Iterations    :   " + this.blockIterations);
                    if (!this.renderer) {
                        this.renderer = new SmartBucketRenderer_1.SmartBucketRenderer();
                    }
                    var self = this;
                    this.pixels = this.renderer.render(this.scene, this.camera, this.i_width, this.i_height, this.cameraSamples, this.hitSamples, this.bounces, this.iterations, this.blockIterations, onUpdate, onInit);
                    function onUpdate(rect) {
                        self.updatePixelsRect(rect, self.pixels);
                    }
                };
                return GIRenderBase;
            })(CanvasDisplay_1.CanvasDisplay);
            exports_1("GIRenderBase", GIRenderBase);
        }
    }
});
//# sourceMappingURL=GIRenderBase.js.map