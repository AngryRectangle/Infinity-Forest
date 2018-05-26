LIBRARY({
    name: "dimensions",
    version: 1,
    shared: true,
    
    api: "CoreEngine"
});



/* Import API modules if needed */

var __global__ = this;

function importModuleIfNeeded(name) {
    if (ModAPI && !__global__[name]) {
        __global__[name] = ModAPI.requireGlobal(name);
    }
}

// import all required modules from AdaptedScript
importModuleIfNeeded("DimensionRegistry");
importModuleIfNeeded("CustomDimension");
importModuleIfNeeded("DimensionTerrainLayer");
importModuleIfNeeded("Noise");
importModuleIfNeeded("Level");
importModuleIfNeeded("MCSystem");



function debugBitmap(bmp) {
    MCSystem.debugBmp(bmp);
}

/* palette for debugging dimension maps represents level index with color */
var DEBUG_COLOR_PALETTE = [android.graphics.Color.WHITE, android.graphics.Color.RED, android.graphics.Color.GREEN, android.graphics.Color.BLUE, android.graphics.Color.YELLOW, android.graphics.Color.CYAN, android.graphics.Color.MAGENTA, android.graphics.Color.rgb(0xFF, 0x99, 00)]; 



/* creates new teleporter to overworld, that needed for modifying its callbacks */
function getDefaultClassLoader() {
    return UI.getContext().getClass().getClassLoader();
}

function newOverworldTeleporter() {
    try {
        var clazz = java.lang.Class.forName("zhekasmirnov.launcher.api.dimension.Teleporter", true, getDefaultClassLoader());
        return clazz.getConstructors()[0].newInstance([null]);
    } catch(e) {
        return null;
    }
}



function isAbleToPerformTransfer() {
    var dim = Player.getDimension();
    return dim != 1 && dim != 2;
}

/*
 Object, that wraps original DimensionRegistry to add more methods and handle callbacks
*/

var WrappedDimensionRegistry = {
    dimensionById: {},
    
    registerDimension: function(dim) {
        this.dimensionById[dim.getId()] = dim;
    },
    
    getDimensionById: function(id) {
        return this.dimensionById[id];
    },
    
    getDimensionByName: function(name) {
        for (var id in this.dimensionById) {
            if (this.dimensionById[id].getName() == name) {
                return this.dimensionById[id];
            }
        }
    },
    
    
    // callbacks
    
    tick: function() {
        var dimension = this.dimensionById[Player.getDimension()];
        if (dimension) {
            dimension.tickCallback();
        }
    },
    
    generateChunk: function(x, z) {
        var dimension = this.dimensionById[Player.getDimension()];
        if (dimension) {
            dimension.generationCallback(x, z);
        }
    },
    
    lastLoadedDimension: null,
    
    dimensionLoaded: function(id) {
        var dimension = this.dimensionById[id];
        if (this.lastLoadedDimension && this.lastLoadedDimension != dimension) {
            this.lastLoadedDimension.unloadedCallback();
        }
        if (dimension) {
            dimension.loadedCallback();
        }
        this.lastLoadedDimension = dimension;
    },
    
    gameLeft: function() {
        this.lastLoadedDimension = null;
    }
};

Callback.addCallback("tick", function() {
    WrappedDimensionRegistry.tick();
    if (World.getThreadTime() % 10 == 0) {
        PortalRegistry.tick();
    }
});


Callback.addCallback("GenerateChunk", function(x, z) {
    WrappedDimensionRegistry.generateChunk();
});

Callback.addCallback("DimensionLoaded", function(id) {
    WrappedDimensionRegistry.dimensionLoaded(id);
});



/* Helper module for parsing description */

var Parser = {
    assertParameterType: function(param, expected, name) {
        var type = typeof(param);
        
        if (type == "undefined" || param == null) {
            return false;
        }
        
        if (!Array.isArray(expected)) {
            expected = [expected];
        }
        
        var isExpected = false;
        for (var i in expected) {
            if (type == expected[i] || expected[i] == "array" && Array.isArray(type)) {
                isExpected = true;
                break;
            }
        }
        
        if (!isExpected) {
            Logger.Log("parameter " + name + " has invalid type " + type + " (" + expected.join(" or ") + " expected) it will be ignored", "ERROR");
            return false;
        }
        
        return true;
    },
    
    parseIdData: function(idData) {
        if (!idData) {
            return null;
        }
        
        var pair = null;
        if (typeof(idData) == "number") {
            pair = [idData, 0];
        }
        else if (typeof(idData.id) == "number") {
            pair = [idData.id, idData.data];
        }
        else if (typeof(idData[0]) == "number") {
            pair = idData;
        }
        else {
            return null;
        }
        
        pair[0] = Math.max(0, parseInt(pair[0]) || 0);
        pair[1] = Math.max(0, parseInt(pair[1]) || 0);
        return pair;
    },
    
    parseCallback: function(callback) {
        if (typeof(callback) == "string") {
            // using apply and modifying parameter array to add callback name will take too much time
            return function(p1, p2, p3, p4, p5) { 
                Callback.invokeCallback(name, p1, p2, p3, p4, p5);
            }
        }
        else {
            return callback;
        }
    },
    
    parseTerrainLayer: function(descr) {
        if (!descr.range) {
            Logger.Log("layer is missing range", "ERROR");
            return;
        }
        
        descr.range[0] = parseInt(descr.range[0]);
        descr.range[1] = parseInt(descr.range[1]);
        
        if (!(descr.range[0] < descr.range[1]) || descr.range[0] < 0 || descr.range[1] > 256) {
            Logger.Log("layer range is invalid: " + descr.range, "ERROR");
            return;
        }
        
        var terrainLayer = new DimensionTerrainLayer(descr.range[0], descr.range[1]);
        
        if (descr.noise) {
            var noisemaps = descr.noise;
            if (!Array.isArray(noisemaps)) {
                noisemaps = [noisemaps];
            }
            for (var i in noisemaps) {
                var map = this.parseNoiseMap(noisemaps[i]);
                if (map) {
                    terrainLayer.addNoiseMap(map);
                }
            }
        }
        
        if (descr.heights) {
            var heightmaps = descr.heights;
            if (!Array.isArray(heightmaps)) {
                heightmaps = [heightmaps];
            }
            for (var i in heightmaps) {
                var map = this.parseNoiseMap(heightmaps[i]);
                if (map) {
                    terrainLayer.addHeightMap(map);
                }
            }
        }
        
        if (descr.gradient) {
            var grad = this.parseGradient(descr.gradient);
            if (grad) {
                terrainLayer.setYGradient(grad);
            }
        }
        
        if (descr.terrain) {
            var base = this.parseIdData(descr.terrain.base);
            if (base) {
                terrainLayer.setupTerrain(base[0], base[1]);
            }
            var filling = descr.terrain.filling;
            if (filling && filling.height > 0) {
                var block = this.parseIdData(filling.block);
                if (block) {
                    terrainLayer.setupFilling(filling.height, block[0], block[1]);
                }
            }
            var cover = descr.terrain.cover;
            if (cover) {
                var height = 1;
                if (cover.height > 0) {
                    height = cover.height;
                }
                
                var top = this.parseIdData(cover.top);
                var block = this.parseIdData(cover.block);
                if (!block) {
                    block = top;
                }
                if (!top) {
                    top = block;
                }
                
                if (block && top) {
                    terrainLayer.setupCover(height, block[0], block[1], top[0], top[1]);
                }
            }
        }
        
        return terrainLayer;
    },
    
    parseNoiseMap: function(descr) {
        var map = new Noise.Map();
        
        if (descr.layers) { // it is map
            var valid = 0;
            for (var i in descr.layers) {
                var layer = this.parseNoiseLayer(descr.layers[i]);
                if (layer) {
                    map.addLayer(layer);
                    valid++;
                }
            }
            
            if (descr.gradient) {
                map.setGradient(this.parseGradient(descr.gradient));
            }
            
            if (valid > 0) {
                return map;
            }
        }
        else {
            var layer = this.parseNoiseLayer(descr);
            if (layer) {
                map.addLayer(layer);
                return map;
            }
        }
        
        return null;
    },
    
    parseNoiseLayer: function(descr) {
        var layer = new Noise.Layer();
        
        if (descr.octaves) { // it is layer
            var valid = 0;
                
            if (Array.isArray(descr.octaves)) {
                for (var i in descr.octaves) {
                    var octave = this.parseNoiseOctave(descr.octaves[i]);
                    if (octave) {
                        layer.addOctave(octave);
                        valid++;
                    }
                }
            }
            else if (descr.octaves.count > 0 && descr.octaves.scale) {
                valid = descr.octaves.count;
                
                var scale = descr.octaves.scale;
                if (!Array.isArray(scale)) {
                    scale = [scale, scale, scale];
                }
                
                var sWeight = 2;
                if (this.assertParameterType(descr.octaves.mw, "number", "layer.octaves.mw")) {
                    sWeight = descr.octaves.mw;
                }
                var sPos = 2;
                if (this.assertParameterType(descr.octaves.mt, "number", "layer.octaves.mt")) {
                    sWeight = descr.octaves.mt;
                }
                
                var mWeight = 1 - 1 / sWeight;
                var mPos = 1;
                
                if (descr.octaves.weight > 0) {
                    mWeight *= descr.octaves.weight;
                }
                
                for (var i = 0; i < descr.octaves.count; i++) {
                    var octave = new Noise.Octave(mWeight);
                    octave.scale(scale[0] * mPos, scale[1] * mPos, scale[2] * mPos);
                    layer.addOctave(octave);
                    mPos *= sPos;
                    mWeight /= sWeight;
                }
            }
            else {
                Logger.Log("invalid layer octaves description " + descr.octaves + ", expected list of octaves or object, formatted as {count: number > 0, scale: ..., ...}", "ERROR");
            }
            
            if (descr.gradient) {
                layer.setGradient(this.parseGradient(descr.gradient));
            }
            
            if (descr.seed) {
                layer.setSeed(descr.seed);
            }
            
            if (valid > 0) {
                return layer;
            }
        }
        else {
            var octave = this.parseNoiseOctave(descr);
            if (octave) {
                layer.addOctave(octave);
                return layer;
            }
        }
        
        return null;
    },
    
    parseNoiseOctave: function(descr) {
        if (descr.weight) { // it is octave
            var octave = new Noise.Octave(descr.weight);
            
            if (this.assertParameterType(descr.offset, ["number", "array"], "octave.seed")) {
                if (Array.isArray(descr.offset)) {
                    octave.translate(descr.offset[0], descr.offset[1], descr.offset[2]);
                }
                else {
                    octave.translate(descr.offset, descr.offset, descr.offset);
                }
            }
            if (this.assertParameterType(descr.scale, ["number", "array"], "octave.seed")) {
                if (Array.isArray(descr.scale)) {
                    octave.scale(descr.scale[0], descr.scale[1], descr.scale[2]);
                }
                else {
                    octave.scale(descr.scale, descr.scale, descr.scale);
                }
            }
            
            return octave;
        }
        else {
            return null;
        }
    },
    
    parseGradient: function(descr) {
        if (Array.isArray(descr)) {
            var grad = new Noise.Gradient();
            for (var i in descr) {
                if (descr[i].length == 2) {
                    grad.add(descr[i][0], descr[i][1]);
                }
                else {
                    Logger.Log("invalid gradient point format: " + descr[i] + " expected [x, y]", "ERROR");
                }
            }
            return grad;
        }
        else {
            return descr;
        }
    }
}



/*
 Wraps original CustomDimension from AdaptedScript to create more friendly API
*/

function Dimension(descr) {
    this.layers = [];
    
    this.setupGeneration = function(description) {
        for (var i in description.layers) {
            var layer = Parser.parseTerrainLayer(description.layers[i]);
            if (layer) {
                this.dimension.addTerrainLayer(layer);
                this.layers.push(layer);
            }
        }
        
        if (description.decoration) {
            if (Parser.assertParameterType(description.decoration.ee, "number", "decoration.biome")) {
                this.dimension.setGlobalBiome(description.decoration.biome);
            }
            if (Parser.assertParameterType(description.decoration.features, ["object", "boolean"], "decoration.features")) {
                this.dimension.setDecorationEnabled(description.decoration.features);
            }
            if (Parser.assertParameterType(description.decoration.cover, ["object", "boolean"], "decoration.cover")) {
                this.dimension.setDefaultBiomeCoverEnabled(description.decorations.cover);
            }
        }
    }
    
    this._prepareTeleporter = function(teleporter, handler, gui) {
        var additionalData = {
            dimension: this,
            teleporter: teleporter
        };
        
        var container = new UI.Container();
        
        teleporter.setCallbacks({
            onStart: function(tp) {
                if (handler && handler.start) {
                    handler.start(additionalData);
                }
                if (gui) {
                    if (gui.open) {
                        gui.open(container);
                    }
                    else if (gui.screen) {
                        container.openAs(gui.screen);
                    }
                }
            },
            
            onHandle: function(tp, progress) {
                if (handler && handler.progress) {
                    handler.progress(progress, additionalData);
                }
                if (gui && gui.progress) {
                    gui.progress(container, progress);
                }
            },
            
            onComplete: function(tp, x, y, z) {
                var pos = {x: x, y: y, z: z};
                
                if (gui && gui.progress) {
                    gui.progress(container, 1);
                }
                
                var portalFound = false;
                if (handler && handler.correctPosition) {
                    portalFound = handler.correctPosition(pos, additionalData);
                }
                if (!portalFound && handler && handler.buildPortal) {
                    handler.buildPortal(pos, additionalData);
                }
                teleporter.setTargetPosition(pos.x, pos.y, pos.z);
                if (gui) {
                    if (gui.close) {
                        gui.close(container);
                    }
                    container.close();
                }
            }
        });
    }
    
    this.setupTransfer = function(description) {
        var allTeleporters = this.getAllTeleporters();
        
        var handler = null;
        if (Parser.assertParameterType(description.handler, "object", "transfer.handler")) {
            var handler = description.handler;
        }
        
        var gui = null;
        if (Parser.assertParameterType(description.gui, "object", "transfer.gui")) {
            gui = description.gui;
        }
    
        var teleporters = this.getAllTeleporters();
        for (var i in teleporters) {
            this._prepareTeleporter(teleporters[i], handler, gui);
        }
    }
    
    this.setupEnvironment = function(description) {
        if (description.sky) {
            if (Array.isArray(description.sky[0])) {
                this.dimension.setSkyColor(description.sky[0][0], description.sky[0][1], description.sky[0][2], description.sky[1][0], description.sky[1][1], description.sky[1][2]);
            }
            else {
                this.dimension.setSkyColor(description.sky[0], description.sky[1], description.sky[2]);
            }
        }
        if (description.fog) {
            if (Array.isArray(description.fog[0])) {
                this.dimension.setFogColor(description.fog[0][0], description.fog[0][1], description.fog[0][2], description.fog[1][0], description.fog[1][1], description.fog[1][2]);
            }
            else {
                this.dimension.setFogColor(description.fog[0], description.fog[1], description.fog[2]);
            }
        }
    }
    
    this.setupCallbacks = function(callbacks) {
        if (callbacks.tick) {
            this._tickCallback = Parser.parseCallback(callbacks.tick);
        }
        if (callbacks.generateChunk) {
            this._generationCallback = Parser.parseCallback(callbacks.generateChunk);
        }
        if (callbacks.loaded) { // this will not work until IC build 25
            this._loadedCallback = Parser.parseCallback(callbacks.loaded);
        }
        if (callbacks.unloaded) { // this will not work until IC build 25
            this._unloadedCallback = Parser.parseCallback(callbacks.unloaded);
        }
    }
    
    
    
    this.getName = function() {
        return this.name;
    }
    
    this.getId = function() {
        return this.dimension.getId();
    }
    
    this.getWrappedObject = function() {
        return this.dimension;
    }
    
    this.getRegion = function() {
        return this.dimension.getRegion();
    }
    
    this.getTeleporter = function() {
        return this.teleporterIn;
    }
    
    this.getTeleporterBack = function() {
        return this.teleporterBack;
    }
    
    this.getAllTeleporters = function() {
        return [this.getTeleporter(), this.getTeleporterBack()];
    }
    
    
    
    this.transferTo = function(tp) {
        if (isAbleToPerformTransfer() && tp.isIdle()) {
            return tp.enter();
        }
        else {
            return false;
        }
    }
    
    this.transferIn = function() {
        return this.transferTo(this.getTeleporter());
    }
    
    this.transferOut = function() {
        return this.transferTo(this.getTeleporterBack());
    }
    
    this.isInDimension = function() {
        return Player.getDimension() == this.getId();
    }
    
    
    
    this.tickCallback = function() {
        if (this._tickCallback) {
            this._tickCallback();
        }
    }
    
    this.generationCallback = function(x, z) {
        if (this._generationCallback) {
            this._generationCallback(x, z);
        }
    }
    
    this.loadedCallback = function() {
        if (this._loadedCallback) {
            this._loadedCallback();
        }
    }
    
    this.unloadedCallback = function() {
        if (this._unloadedCallback) {
            this._unloadedCallback();
        }
    }
    
    
    
    this.debugTerrainMap = function(size, stride, show) {
        if (!size) {
            size = 128;
        }
        if (!stride) {
            stride = 1;
        }
        
        alert("creating debug terrain map with size=" + size + " stride=" + stride + " this will take a long time (" + this.layers.length + " layers)");
        
        var map = null;
        for (var i in this.layers) {
            var layer = this.layers[i].visualizeMap(size, stride, DEBUG_COLOR_PALETTE[i % DEBUG_COLOR_PALETTE.length]);
            
            if (!map) {
                map = layer;
            }
            else {
                for (var x = 0; x < size; x++) {
                    for (var y = 0; y < size; y++) {
                        var p = layer.getPixel(x, y);
                        if (map.getPixel(x, y) >>> 24 <= p >>> 24) {
                            map.setPixel(x, y, p);
                        }
                    }
                }
            }
            
            alert("completed layer " + i);
        }
        
        var _map = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888);
        var canvas = new android.graphics.Canvas(_map);
        canvas.drawColor(android.graphics.Color.BLACK);
        if (map) {
            canvas.drawBitmap(map, 0, 0, null);
        }
        
        if (show) {
            debugBitmap(_map);
        }
        
        return _map;
    }
    
    this.debugTerrainSlice = function(size, stride, show) {
        var slice = android.graphics.Bitmap.createBitmap(size, 256 / stride, android.graphics.Bitmap.Config.ARGB_8888);
        var canvas = new android.graphics.Canvas(slice);
        canvas.drawColor(android.graphics.Color.BLACK);
        
        for (var i in this.layers) {
            var layer = this.layers[i].visualizeSlice(size, stride, DEBUG_COLOR_PALETTE[i % DEBUG_COLOR_PALETTE.length]);
            if (layer) {
                canvas.drawBitmap(layer, 0, 0, null);
            }
        }
        
        if (show) {
            debugBitmap(slice);
        }
        
        return slice;
    }
    
    
    
    this._initDimension = function(name) {
        this.dimension = new CustomDimension(name);
        this.name = name;
        this.teleporterIn = this.dimension.getTeleporter();
        this.teleporterBack = newOverworldTeleporter();
    }
    
    // setup by constructor parameter 
    
    if (Parser.assertParameterType(descr, ["string", "object"], "dimension")) {
        if (typeof(descr) == "string") {
            this._initDimension(descr);
        }
        else if (descr.name) {
            this._initDimension(descr.name);
            if (Parser.assertParameterType(descr.generation, "object", "dimension.generation")) {
                this.setupGeneration(descr.generation);
            }
            if (Parser.assertParameterType(descr.environment, "object", "dimension.environment")) {
                this.setupEnvironment(descr.environment);
            }
            if (Parser.assertParameterType(descr.transfer, "object", "dimension.transfer")) {
                this.setupTransfer(descr.transfer);
            }
            if (Parser.assertParameterType(descr.callbacks, "object", "dimension.callbacks")) {
                this.setupCallbacks(descr.callbacks);
            }
        } 
    }
    if (!this.dimension) {
        throw new Error("dimension constructor parameter is invalid it must be formatted as string representing name or as object {name: ..., ...}");
    }
    
    WrappedDimensionRegistry.registerDimension(this);
} 



var PortalRegistry = {
    PORTAL_BLOCK_TYPE: Block.createSpecialType({
            base: 90,
            lightlevel: 15,
            rendertype: 0,
            renderlayer: 1,
            explosionres: 9999
        }, "custom-portal"),
    
    portalBlocks: {
        
    },
    
    lastTickPortal: null,
    
    getPortalForBlock: function(id) {
        return this.portalBlocks[id];
    },
    
    getPortalForEntityPos: function(pos) {
        var x = Math.floor(pos.x);
        var y = Math.floor(pos.y);
        var z = Math.floor(pos.z);
        return this.getPortalForBlock(World.getBlockID(x, y, z)) || this.getPortalForBlock(World.getBlockID(x, y - 1, z));
    },
    
    tick: function() {
        var pos = Player.getPosition();
        if (pos.y > 255) {
            return;
        }
        
        var portal = this.getPortalForEntityPos(pos);
        if (portal) {
            if (!this.lastTickPortal) {
                this.lastTickPortal = portal;
                portal.startTransfer();
            }
        }
        else {
            this.lastTickPortal = null;
        }
    },
    
    registerPortalBlock: function(id, portal) {
        var id = Block.getNumericId(id);
        if (id != -1) {
            if (portal) {
                this.portalBlocks[id] = portal;
            }
            else {
                delete this.portalBlocks[id];
            }
        }
    },
    
    RENDER_TYPE_FULL: "full",
    RENDER_TYPE_VERTICAL_PLANE: "v-plane",
    RENDER_TYPE_HORIZONTAL_PLANE: "h-plane",
    RENDER_TYPE_UNIVERSAL_PLANE: "u-plane",
    
    setupPortalBlock: function(id, texture, portalRenderParams) {
        id = Block.getNumericId(id);
        if (id == -1) {
            return;
        }
        
        var render = new ICRender.Model();
        var group = ICRender.getGroup("custom-portal-block-" + id);
        
        if (!portalRenderParams.ignoreSelf) {
            group.add(id, -1);
        }
        if (portalRenderParams.frameId) {
            group.add(portalRenderParams.frameId, -1);
        }
        
        
        if (portalRenderParams.type == this.RENDER_TYPE_FULL) {
            render.addEntry(BlockRenderer.createTexturedBlock(texture));
        }
        else if (portalRenderParams.type == this.RENDER_TYPE_HORIZONTAL_PLANE) {
            render.addEntry(BlockRenderer.createTexturedBox(0, .375, 0, 1, .625, 1, texture));
        }
        else if (portalRenderParams.type == this.RENDER_TYPE_VERTICAL_PLANE) {
            var xAxis = BlockRenderer.createTexturedBox(0, 0, .375, 1, 1, .625, texture);
            var zAxis = BlockRenderer.createTexturedBox(.375, 0, 0, .625, 1, 1, texture);
            
            render.addEntry(xAxis).setCondition(ICRender.NOT(
                ICRender.OR(
                    ICRender.BLOCK(0, 0, 1, group, false),
                    ICRender.BLOCK(0, 0, -1, group, false)
                )
            ));
            
            render.addEntry(zAxis).setCondition(ICRender.OR(
                ICRender.BLOCK(0, 0, 1, group, false),
                ICRender.BLOCK(0, 0, -1, group, false)
            ));
        }
        else if (portalRenderParams.type == this.RENDER_TYPE_UNIVERSAL_PLANE) {
            var xAxis = BlockRenderer.createTexturedBox(0, 0, .375, 1, 1, .625, texture);
            var yAxis = BlockRenderer.createTexturedBox(0, .375, 0, 1, .625, 1, texture);
            var zAxis = BlockRenderer.createTexturedBox(.375, 0, 0, .625, 1, 1, texture);
            
            render.addEntry(xAxis).setCondition(ICRender.NOT(
                ICRender.OR(
                    ICRender.BLOCK(0, 0, 1, group, false),
                    ICRender.BLOCK(0, 0, -1, group, false)
                )
            ));
            
            render.addEntry(zAxis).setCondition(ICRender.AND(
                ICRender.OR(
                    ICRender.BLOCK(0, 0, 1, group, false),
                    ICRender.BLOCK(0, 0, -1, group, false)
                ),
                ICRender.NOT(
                    ICRender.AND(
                        ICRender.BLOCK(1, 0, 0, group, false),
                        ICRender.BLOCK(-1, 0, 0, group, false),
                        ICRender.BLOCK(0, 0, 1, group, false),
                        ICRender.BLOCK(0, 0, -1, group, false)
                    )
                )
            ));
            
            render.addEntry(yAxis).setCondition(ICRender.AND(
                ICRender.BLOCK(1, 0, 0, group, false),
                ICRender.BLOCK(-1, 0, 0, group, false),
                ICRender.BLOCK(0, 0, 1, group, false),
                ICRender.BLOCK(0, 0, -1, group, false)
            ));
        }
        else {
            Logger.Log("invalid portal block render type: " + portalRenderParams.type, "ERROR");
            return;
        }
        
        
        BlockRenderer.setStaticICRender(id, -1, render);
    },
    
    newPortalBlock: function(id, texture, portal, portalRenderParams, debugEnabled) {
        IDRegistry.genBlockID(id);
        
        if (texture && typeof(texture[0]) == "string") {
            texture = [texture];
        }
        
        Block.createBlock(id, [
            {name: "tile.portal." + id, texture: texture, inCreative: debugEnabled}
        ], this.PORTAL_BLOCK_TYPE);
        
        var shape = new ICRender.CollisionShape();
        BlockRenderer.setCustomCollisionShape(Block.getNumericId(id), -1, shape); 
        Block.setDestroyTime(Block.getNumericId(id), -1, -1);
        
        if (portal) {
            this.registerPortalBlock(id, portal);
        }
        
        if (portalRenderParams) {
            this.setupPortalBlock(id, texture, portalRenderParams);
        }
    }
};



function Portal(dimension) {
    this.dimension = dimension;
    this.timeout = 0;
    this.overlay = null;
    this.interruptible = true;
    
    this.setTimeout = function(t) {
        this.timeout = t;
    }
    
    this.setOverlay = function(overlay) {
        this.overlay = overlay;
    }
    
    this.setInterruptible = function(b) {
        this.interruptible = b;
    }
    
    
    
    this.getCurrentTeleporter = function() {
        if (this.dimension && isAbleToPerformTransfer()) {
            if (this.dimension.isInDimension()) {
                return this.dimension.getTeleporterBack();
            }
            else {
                return this.dimension.getTeleporter();
            }
        }
    }
    
    this.isIdle = function() {
        return !this.isTransferInProgress();
    }
    
    this.cancelTransfer = function() {
        if (this.interruptible) {
            this.isTransferCancelled = true;
            if (this.overlay) {
                this.overlay.fade();
            }
        }
    }
    
    this.onTransferRequested = function() {
        var tp = this.getCurrentTeleporter();
        return tp && tp.isIdle();
    }
    
    this.onTransferStarted = function() {
        if (this.overlay) {
            this.overlay.setAlpha(0);
            this.overlay.open();
        }
    }
    
    this.onTransferInProgress = function(progress) {
        if (this != PortalRegistry.getPortalForEntityPos(Player.getPosition())) {
            this.cancelTransfer();
        }
        
        if (this.overlay) {
            this.overlay.setAlpha(progress / this.timeout);
        }
        
        return progress >= this.timeout;
    }
    
    this.onTransferComplete = function(progress) {
        var tp = this.getCurrentTeleporter();
        
        if (tp && tp.isIdle()) {
            if (this.overlay) {
                this.overlay.fade();
            }
            return tp.enter();
        }
        else {
            return false;
        }
    }
    
    this.setCallback = function(name, callback) {
        var validCallbacks = ["onTransferRequested", "onTransferStarted", "onTransferInProgress", "onTransferComplete"];
        
        var isValid = false;
        for (var i in validCallbacks) {
            if (validCallbacks[i] == name) {
                isValid = true;
                break;
            }
        }
        
        if (isValid) {
            this[name] = callback;
        }
        else {
            Logger.Log("invalid portal callback name: " + name + " required: " + validCallbacks, "ERROR");
        }
    }
    
    
    
    this.transferUpdatable = null;
    
    this.isTransferInProgress = function() {
        return this.transferUpdatable != null;
    }
    
    this.startTransfer = function() {
        if (this.isTransferInProgress()) {
            return false;
        }
        
        if (!this.onTransferRequested()) {
            return false;
        }
        
        this.isTransferCancelled = false;
        this.transferUpdatable = {
            portal: this,
            progress: 0,
            
            finish: function() {
                this.remove = true;
                this.portal.transferUpdatable = null;
            },
            
            update: function() {
                if (this.progress == 0) {
                    this.portal.onTransferStarted();
                }
                if (this.portal.onTransferInProgress(this.progress)) {
                    if (!this.portal.isTransferCancelled && this.portal.onTransferComplete(this.progress)) {
                        this.finish();
                    }
                }
                if (this.portal.isTransferCancelled) {
                    this.finish();
                    this.portal.isTransferCancelled = false;
                }
                
                this.progress++;
            }
        };
        
        Updatable.addUpdatable(this.transferUpdatable);
        return true;
    }
}



function DimensionTransfer(dimension) {
    this.dimension = dimension;
    this.overlay = null;
    this.idle = true;
    
    var self = this;
    this.handler = {
        transfer: this,
        dimension: this.dimension,
        
        portalBlockId: -1,
        frameBlockId: -1,
        portalSearchRadius: 5,
        
        start: function() {
            self.idle = false;
        },
        
        progress: function() {
            
        },
        
        correctPosition: function(pos) {
            if (this.portalBlockId > 0) {
                var portalPos = DimensionHelper.searchForPortal(pos, this.portalBlockId, {radius: this.portalSearchRadius});
                if (portalPos) {
                    var correctedPos = DimensionHelper.adjustPlayerInPortal(portalPos, this.portalBlockId, {frameId: this.frameBlockId});
                    pos.x = Math.floor(correctedPos.x) + .5;
                    pos.y = correctedPos.y;
                    pos.z = Math.floor(correctedPos.z) + .5;
                    self.idle = true;
                    return true;
                }
            }
            
            return false;
        },
        
        buildPortal: function(pos) {
            if (self.portalBuilder) {
                self.portalBuilder(pos);
            }
            self.idle = true;
        }
    };
    
    this.gui = {
        transfer: this,
        dimension: this.dimension,
        
        screen: new UI.Window({
            location: {
                fullscreen: true
            },
            
            drawing: [
                
            ],
            
            elements: {
                text: {
                    type: "text",
                    x: 500, y: UI.getScreenHeight() / 2 - 35, z: 1,
                    text: "Teleporting...",
                    font: {color: android.graphics.Color.WHITE, size: 22, shadow: 0, align: 1}
                },
                
                background: {
                    type: "custom",
                    x: 0, y: 0, z: -1,
                    progress: 0,
                    
                    custom: {
                        texture: "",
                        resizeToScreen: false,
                        scaleColor: android.graphics.Color.GREEN,
                        scaleBgColor: android.graphics.Color.argb(128, 0, 40, 0),
                        scaleAtBottom: false
                    },
                    
                    onSetup: function(element) {
                        this.backgroundTexture = UI.TextureSource.get(this.texture);
                        this.paint = new android.graphics.Paint();
                        this.fgPaint = new android.graphics.Paint();
                        this.fgPaint.setColor(this.scaleColor);
                        this.bgPaint = new android.graphics.Paint();
                        this.bgPaint.setColor(this.scaleBgColor);
                        
                        var self = element.getScope();
                        self.progress = this.progress;
                    },
                
                    onDraw: function(element, canvas, scale) {
                        var self = element.getScope();
                        var texWidth = this.backgroundTexture.getWidth();
                        var texHeight = this.backgroundTexture.getHeight();
                        var screenWidth = canvas.getWidth();
                        var screenHeight = canvas.getHeight();
                    
                        var delta = this.resizeToScreen ? 0 : texHeight / texWidth - screenHeight / screenWidth;
                        canvas.drawBitmap(this.backgroundTexture, null, new android.graphics.Rect(0, -screenHeight * delta / 2, screenWidth, screenHeight + screenHeight * delta / 2), this.paint);
                    
                        var scaleWidth = screenWidth / 170;
                        if (this.scaleAtBottom) {
                            var scaleRect = new android.graphics.Rect(0, screenHeight - scaleWidth, screenWidth, screenHeight);
                        }
                        else {
                            var scaleLength = screenWidth / 3.4;
                            var scaleRect = new android.graphics.Rect((screenWidth - scaleLength) / 2, screenHeight / 2 + 35, (screenWidth + scaleLength) / 2, screenHeight / 2 + scaleWidth + 35);
                        }
                        
                        canvas.drawRect(scaleRect, this.bgPaint);
                        scaleRect.right = parseInt(scaleRect.width() * self.progress + scaleRect.left);
                        canvas.drawRect(scaleRect, this.fgPaint);
                        
                    },
                    
                    onBindingUpdated: function(element, name, value) {
                        var self = element.getScope();
                        if (name == "progress") {
                            self.progress = value;
                        }
                    }
                }
            }
        }),
        
        progress: function(container, progress) {
            container.setBinding("background", "progress", progress);
        },
        
        close: function(container) {
            container.close();
            if (self.overlay) {
                self.overlay.setAlpha(.75);
                self.overlay.open();
                self.overlay.fade();
            }
        }
    };
    
    
    
    this.setPortalTiles = function(portalId, frameId) {
        this.handler.portalBlockId = portalId || -1;
        this.handler.frameBlockId = frameId || -1;
    }
    
    this.setHandlerCallback = function(name, callback) {
        this.handler[name] = callback;
    }
    
    this.setUiCallback = function(name, callback) {
        this.gui[name] = callback;
    }
    
    this.setPortalSearchRadius = function(radius) {
        this.transfer.portalSearchRadius = radius;
    }
    
    this.setOverlay = function(overlay) {
        this.overlay = overlay;
    }
    
    this.setLoadingScreenParams = function(params) {
        var content = this.gui.screen.getContent();
        var background = content.elements.background.custom;
        for (var name in params) {
            background[name] = params[name];
        }
        if (params.text) {
            content.elements.text.text = params.text + "";
        }
    }
    
    this.isIdle = function() {
        return this.idle;
    }
    
    this.setPortalBuilder = function(builder) {
        this.portalBuilder = builder;
    }
}



function TransferSequence(dimension) {
    this.dimension = dimension;
     
    this.portal = new Portal(dimension);
    this.transfer = new DimensionTransfer(dimension);
    this.dimension.setupTransfer(this.transfer);
    
    
    
    this.getPortal = function() {
        return this.portal;
    }
    
    this.getTransfer = function() {
        return this.transfer;
    }
    
    
    
    this.setPortalCallback = function(name, callback) {
        this.portal.setCallback(name, callback);
    }
    
    this.setUiCallback = function(name, callback) {
        this.transfer.setUiCallback(name, callback);
    }
    
    this.setHandlerCallback = function(name, callback) {
        this.transfer.setHandlerCallback(name, callback);
    }
    
    
    this.portalId = -1;
    this.frameId = -1;
    
    this.setPortalTiles = function(portalId, frameId) {
        this.transfer.setPortalTiles(portalId, frameId);
        this.portalId = portalId;
        this.frameId = frameId;
    }
    
    this.setPortalSearchRadius = function(radius) {
        this.transfer.setPortalSearchRadius(radius);
    }
    
    this.setPortalTimeout = function(timeout) {
        this.portal.setTimeout(timeout);
    }
    
    this.setPortalOverlay = function(overlay) {
        this.portal.setOverlay(overlay);
        this.transfer.setOverlay(overlay);
    }
    
    this.setPortalBuilder = function(builder) {
        this.transfer.setPortalBuilder(builder);
    }
    
    this.setLoadingScreenParams = function(params) {
        this.transfer.setLoadingScreenParams(params);
    }
    
    this.setInterruptible = function(b) {
        this.portal.setInterruptible(b);
    }
    
    this.isIdle = function() {
        return this.portal.isIdle() && this.transfer.isIdle();
    }
    
    this.startTransfer = function() {
        if (!this.isIdle()) {
            this.portal.startTransfer();
        }
    }
}




function PortalShape() {
    this.minWidth = 1;
    this.minHeight = 1;
    
    this.spaceIds = {0: true};
    this.frameIds = {};
    this.buildIds = {
        portal: -1,
        frame: -1
    };
    
    this.orientation = {
        vertical: true,
        horizontal: true
    };
    
    
    
    this.setMinSize = function(w, h) {
        this.minWidth = w;
        this.minHeight = h;
    }
    
    this.setPortalId = function(id) {
        this.buildIds.portal = id;
        this.spaceIds[id] = true;
    }
    
    this.setFrameIds = function() {
        this.frameIds = {};
        
        for (var i in arguments) {
            var id = parseInt(arguments[i]);
            this.frameIds[id] = true;
            if (i == 0) {
                this.buildIds.frame = id;
            }
        }
    }
    
    this.setSpaceIds = function() {
        this.spaceIds = {0: true};
        
        for (var i in arguments) {
            var id = parseInt(arguments[i]);
            this.spaceIds[id] = true;
        }
    }
    
    this.setVertical = function(b) {
        this.orientation.vertical = b;
    }
    
    this.setHorizontal = function(b) {
        this.orientation.horizontal = b;
    }
    
    
    
    this.isFrameTileAt = function(x, y, z) {
        return this.frameIds[World.getBlockID(x, y, z)];
    }
    
    this.isSpaceTileAt = function(x, y, z) {
        return this.spaceIds[World.getBlockID(x, y, z)];
    }
    
    this._searchForFrameTile = function(x, y, z, ax, ay, az) {
        var len = 0;
        while(!this.isFrameTileAt(x, y, z)) {
            x += ax;
            y += ay;
            z += az;
            len++;
            if (len > 16) {
                return -1;
            }
        }
        return len;
    }
    
    this._buildRect = function(pos, raw) {
        if (raw.minX != -1 && raw.minY != -1 && raw.maxX != -1 && raw.maxY != -1) {
            var rect = {
                minX: -raw.minX,
                maxX: raw.maxX + 1,
                minY: -raw.minY,
                maxY: raw.maxY + 1,
                plane: raw.plane,
                
                width: function() {
                    return this.maxX - this.minX;
                },
                
                height: function() {
                    return this.maxY - this.minY;
                },
                
                offset: pos,
            };
            
            switch(rect.plane) {
                case "oX":
                rect.convert = function(x, y, z) {
                    return {
                        x: this.offset.x + (z || 0),
                        y: this.offset.y + y,
                        z: this.offset.z + x
                    }
                }
                break;
                case "oY":
                rect.convert = function(x, y, z) {
                    return {
                        x: this.offset.x + x,
                        y: this.offset.y + (z || 0),
                        z: this.offset.z + y
                    }
                }
                break;
                case "oZ":
                rect.convert = function(x, y, z) {
                    return {
                        x: this.offset.x + x,
                        y: this.offset.y + y,
                        z: this.offset.z + (z || 0)
                    }
                }
                break;
                default:
                return;
            }
            
            return rect;
        }
    }
    
    this._getPossibleRects = function(x, y, z) {
        var distances = {
            left: this._searchForFrameTile(x, y, z, -1, 0, 0),
            right: this._searchForFrameTile(x, y, z, 1, 0, 0),
            down: this._searchForFrameTile(x, y, z, 0, -1, 0),
            up: this._searchForFrameTile(x, y, z, 0, 1, 0),
            back: this._searchForFrameTile(x, y, z, 0, 0, -1),
            forward: this._searchForFrameTile(x, y, z, 0, 0, 1),
        }
        
        var rawRects = [];
        if (this.orientation.horizontal) {
            rawRects.push({
                minX: distances.left,
                maxX: distances.right,
                minY: distances.back,
                maxY: distances.forward,
                plane: "oY"
            });
        }
        if (this.orientation.vertical) {
            rawRects.push({
                minX: distances.back,
                maxX: distances.forward,
                minY: distances.down,
                maxY: distances.up,
                plane: "oX"
            });
            rawRects.push({
                minX: distances.left,
                maxX: distances.right,
                minY: distances.down,
                maxY: distances.up,
                plane: "oZ"
            });
        }
        
        var rects = [];
        for (var i in rawRects) {
            var rect = this._buildRect({x: x, y: y, z: z}, rawRects[i]);
            if (rect && rect.width() - 2 >= this.minWidth && rect.height() - 2 >= this.minHeight) {
                rects.push(rect);
            }
        }
        
        return rects;
    }
    
    this._checkRect = function(rect) { 
        for (var x = rect.minX + 1; x < rect.maxX - 1; x++) {
            var pos1 = rect.convert(x, rect.minY);
            var pos2 = rect.convert(x, rect.maxY - 1);
            if (!this.isFrameTileAt(pos1.x, pos1.y, pos1.z) || !this.isFrameTileAt(pos2.x, pos2.y, pos2.z)) {
                return false;
            }
        }
        
        for (var y = rect.minY + 1; y < rect.maxY - 1; y++) {
            var pos1 = rect.convert(rect.minX, y);
            var pos2 = rect.convert(rect.maxX - 1, y);
            if (!this.isFrameTileAt(pos1.x, pos1.y, pos1.z) || !this.isFrameTileAt(pos2.x, pos2.y, pos2.z)) {
                return false;
            }
        }
        
        for (var x = rect.minX + 1; x < rect.maxX - 1; x++) {
            for (var y = rect.minY + 1; y < rect.maxY - 1; y++) {
                var pos = rect.convert(x, y);
                if (!this.isSpaceTileAt(pos.x, pos.y, pos.z)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    this._buildPortalPlane = function(rect) {
        for (var x = rect.minX + 1; x < rect.maxX - 1; x++) {
            for (var y = rect.minY + 1; y < rect.maxY - 1; y++) {
                var pos = rect.convert(x, y);
                World.setBlock(pos.x, pos.y, pos.z, this.buildIds.portal);
            }
        }
    }
    
    this._buildPortalFrame = function(rect) {
        for (var x = rect.minX; x < rect.maxX; x++) {
            var pos1 = rect.convert(x, rect.minY);
            World.setBlock(pos1.x, pos1.y, pos1.z, this.buildIds.frame);
            var pos2 = rect.convert(x, rect.maxY - 1);
            World.setBlock(pos2.x, pos2.y, pos2.z, this.buildIds.frame);
            var pos3 = rect.convert(x, rect.minY, -1);
            World.setBlock(pos3.x, pos3.y, pos3.z, this.buildIds.frame);
            var pos4 = rect.convert(x, rect.minY, 1);
            World.setBlock(pos4.x, pos4.y, pos4.z, this.buildIds.frame);
        }
        
        for (var y = rect.minY; y < rect.maxY; y++) {
            var pos1 = rect.convert(rect.minX, y);
            World.setBlock(pos1.x, pos1.y, pos1.z, this.buildIds.frame);
            var pos2 = rect.convert(rect.maxX - 1, y);
            World.setBlock(pos2.x, pos2.y, pos2.z, this.buildIds.frame);
        }
    }
    
    this._clearArea = function(rect) {
        for (var z = -2; z <= 2; z++) {
            for (var x = rect.minX; x < rect.maxX; x++) {
                for (var y = rect.minY + 1; y < rect.maxY; y++) {
                    var pos = rect.convert(x, y, z);
                    World.setBlock(pos.x, pos.y, pos.z, 0);
                }
            }
        }
    }
    
    this.findPortal = function(x, y, z) {
        var rects = this._getPossibleRects(x, y, z);
        for (var i in rects) {
            if (this._checkRect(rects[i])) {
                return rects[i];
            }
        }
    }
    
    this.buildPortal = function(rect, isNewOne) {
        if (isNewOne) {
            this._clearArea(rect);
            this._buildPortalFrame(rect);
        }
        this._buildPortalPlane(rect);
    }
    
    this.getBuilder = function() {
        var self = this;
        
        return function(pos) {
            pos.y++; 
            var x = Math.floor(pos.x);
            var y = Math.floor(pos.y) - 2;
            var z = Math.floor(pos.z) - 1;
            
            var rect = self._buildRect({x: x, y: y, z: z}, {
                minX: 0,
                minY: 0, 
                maxX: self.minWidth + 1,
                maxY: self.minHeight + 1,
                plane: self.orientation.vertical ? "oX" : "oY"
            });
            
            self.buildPortal(rect, true);
        }
    }
}



var DimensionHelper = {
    searchForPortal: function(pos, blockId, options) {
        if (!options) {
            options = {};
        }
        if (!options.radius) {
            options.radius = 3;
        }
        if (!options.range) {
            options.range = [0, 256];
        }
        
        
        var rad = options.radius;
        var closestPos = null;
        var closestDis = -1;
        
        var posx = Math.floor(pos.x);
        var posz = Math.floor(pos.z);
        for (var y = options.range[0]; y < options.range[1]; y++) {
            for (var x = -rad; x <= rad; x++) {
                for (var z = -rad; z <= rad; z++) {
                    var px = posx + x;
                    var pz = posz + z;
                    if (World.getBlockID(px, y, pz) == blockId) {
                        var dis = x * x + (y - 128) * (y - 128) + z * z;
                        if (dis < closestDis || !closestPos) {
                            closestDis = dis;
                            closestPos = {x: px, y: y, z: pz};
                        }
                        if (options.fast) {
                            break;
                        }
                    }
                }
            }
        }
        
        return closestPos;
    },
    
    adjustPlayerInPortal: function(pos, blockId, options) {
        if (!options) {
            options = {};
        }
        if (!options.frameId) {
            options.frameId = 1;
        }
        
        var posx = Math.floor(pos.x);
        var posy = Math.floor(pos.y);
        var posz = Math.floor(pos.z);
        
        while (World.getBlockID(posx, posy, posz) == blockId && posy > 0) {
            posy--;
        }
        
        if (options.frameId > 0 && World.getBlockID(posx, posy, posz) == 0) {
            World.setBlock(posx, posy, posz, options.frameId);
        }
        
        for (var y = 1; y < 3; y++) {
            var bId = World.getBlockID(posx, posy + y, posz);
            if (bId != 0 && bId != blockId) {
                World.setBlock(posx, posy + y, posz, options.placePortal ? blockId : 0);
            }
        }
        
        if (options.movePlayer) {
            Player.setPosition(posx + .5, posy + 2.63, posz + .5);
        }
    
        return {x: posx + .5, y: posy + 2.63, z: posz + .5};
    },
    
    eliminateIncorrectPlacedPortals: function(pos, portalId, frameIds) {
        var validIds = {};
        validIds[portalId] = true;
        for (var i in frameIds) {
            validIds[frameIds[i]] = true;
        }
        
        
        Updatable.addUpdatable({
            _checkPortal: function(x, y, z) {
                var count = 0;
                if (validIds[World.getBlockID(x - 1, y, z)] && validIds[World.getBlockID(x + 1, y, z)]) {
                    count++;
                }
                if (validIds[World.getBlockID(x, y - 1, z)] && validIds[World.getBlockID(x, y + 1, z)]) {
                    count++;
                }
                if (validIds[World.getBlockID(x, y, z - 1)] && validIds[World.getBlockID(x, y, z + 1)]) {
                    count++;
                }
                return count == 2;
            },
            
            _checkRecursive: function(x, y, z) {
                if (World.getBlockID(x, y, z) == portalId) {
                    if (!this._checkPortal(x, y, z)) {
                        World.setBlock(x, y, z, 0);
                        this._checkAround(x, y, z);
                    }
                }
            },
            
            _checkAround: function(x, y, z) {
                this._checkRecursive(x + 1, y, z);
                this._checkRecursive(x - 1, y, z);
                this._checkRecursive(x, y + 1, z);
                this._checkRecursive(x, y - 1, z);
                this._checkRecursive(x, y, z + 1);
                this._checkRecursive(x, y, z - 1);
            },
            
            update: function() {
                this.remove = true;
                this._checkAround(pos.x, pos.y, pos.z);
            }
        })
    }
}



var CURRENT_PORTAL_OVERLAY = null;

function PortalOverlayWindow(content) {
    this.alpha = 1;
    
    var overlay = this;
    this.window = new UI.Window({
        location: {
            fullscreen: true
        },
        
        drawing: [
            {type: "color", color: 0}
        ],
        
        elements: {
            "overlay": {
                type: "custom",
                
                custom: {
                    alpha: 0
                },
                
                onSetup: function(element) {
                    this.animationTexture = UI.TextureSource.get(content.texture);
                    this.animationFrames = content.frames || 1;
                    this.animationRate = content.rate || 1;
                    this.paint = new android.graphics.Paint();
                    
                    var self = element.getScope();
                    self.alpha = overlay.alpha;
                },
                
                onDraw: function(element, canvas, scale) {
                    var self = element.getScope();
                    var width = canvas.getWidth();
                    var height = canvas.getHeight();
                    
                    this.paint.setAlpha(self.alpha * 255);
                    
                    if (this.animationFrames > 1) {
                        var texWidth = this.animationTexture.getWidth();
                        var texHeight = this.animationTexture.getHeight();
                        var frameCount = this.animationFrames;
                        var frameIndex = parseInt(java.lang.System.currentTimeMillis() * this.animationRate / 1000) % frameCount;
                        canvas.drawBitmap(this.animationTexture, new android.graphics.Rect(0, frameIndex * texHeight / frameCount, texWidth, (frameIndex + 1) * texHeight / frameCount), new android.graphics.Rect(0, 0, width, height), this.paint);
                    }
                    else {
                        canvas.drawBitmap(this.animationTexture, null, new android.graphics.Rect(0, 0, width, height), this.paint);
                    }
                },
                
                onBindingUpdated: function(element, name, val) {
                    var self = element.getScope();
                    if (name == "alpha") {
                        self.alpha = parseFloat(val) || 0;
                    }
                }
            }
        }
    });
    
    this.window.setTouchable(false);
    this.window.setAsGameOverlay(false);
    
    this.container = new UI.Container();
    
    this.open = function() {
        if (CURRENT_PORTAL_OVERLAY) {
            CURRENT_PORTAL_OVERLAY.close();
        }
        CURRENT_PORTAL_OVERLAY = this;
        this.container.openAs(this.window);
    }
    
    this.close = function() {
        CURRENT_PORTAL_OVERLAY = null;
        this.container.close();
    }
    
    this.fade = function() {
        if (content.fade > 0) {
            var self = this;
            var alpha = this.alpha;
            var start = java.lang.System.currentTimeMillis();
            (new java.lang.Thread({
                run: function() {
                    try {
                        while (self.alpha > 0) {
                            var time = java.lang.System.currentTimeMillis() - start;
                            self.setAlpha(alpha * (1 - time / (content.fade * 1000)));
                            java.lang.Thread.sleep(20);
                        }
                    } catch(e) {};
                    self.close();
                }
            })).start();
        }
        else {
            this.close();
        }
    }
    
    this.setAlpha = function(alpha) {
        alpha = parseFloat(alpha) || 0;
        alpha = Math.max(0, Math.min(1, alpha));
        this.container.setBinding("overlay", "alpha", alpha);
        this.alpha = alpha;
    }
}



/*
 Extends World API module with new methods
*/

World.setSkyColor = function(r, g, b) {
    Level.setSkyColor(r, g, b);
}

World.resetSkyColor = function() {
    Level.resetSkyColor();
}

World.setFogColor = function(r, g, b) {
    Level.setFogColor(r, g, b);
}

World.resetFogColor = function() {
    Level.resetFogColor();
}



// export dimension modules
EXPORT("Noise", Noise);
EXPORT("Dimension", Dimension);
EXPORT("DimensionRegistry", WrappedDimensionRegistry);
EXPORT("PortalRegistry", PortalRegistry);
EXPORT("Portal", Portal);
EXPORT("DimensionTransfer", DimensionTransfer);
EXPORT("TransferSequence", TransferSequence);
EXPORT("PortalShape", PortalShape);
EXPORT("PortalOverlayWindow", PortalOverlayWindow);
EXPORT("DimensionHelper", DimensionHelper);

























