System.register([], function(exports_1) {
    var GIThree;
    return {
        setters:[],
        execute: function() {
            GIThree = (function () {
                function GIThree(scene) {
                    this.scene = scene;
                    console.log(scene);
                }
                return GIThree;
            })();
            exports_1("GIThree", GIThree);
        }
    }
});
//# sourceMappingURL=GIThree.js.map