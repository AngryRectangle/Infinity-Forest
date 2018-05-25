var CustomDimension = ModAPI.requireGlobal("CustomDimension"); 
var Noise = ModAPI.requireGlobal("Noise"); 
var DimensionTerrainLayer = ModAPI.requireGlobal("DimensionTerrainLayer"); 
 
var dimension = new CustomDimension("testDimension"); 
 dimension.setGlobalBiome(1);
 dimension.setDecorationEnabled(false);
 dimension.setDefaultBiomeCoverEnabled(false);
 var biomLayer;

// add normal terrain 
 
(function() { 
 var noiseMap = new Noise.Map(); 
 var noiseLayer = new Noise.Layer(); 
 noiseMap.addLayer(noiseLayer); 
 var scale = 0.01; 
 var weight = 0.51; 
 for(var i = 0; i < 5; i++){ 
  noiseLayer.addOctave(new Noise.Octave(weight).scale(scale * 1, scale * 1, scale * 1)) 
  scale *= 2; 
  weight /= 2; 
 } 
 var graditent = new Noise.Gradient(); 
 graditent.add(0, 1); 
 graditent.add(0.4, 1); 
 graditent.add(0.5, 0); 
 graditent.add(0.6, -1); 
 graditent.add(1, -1); 
 var layer = new DimensionTerrainLayer(0, 128); 
 dimension.addTerrainLayer(layer); 
 layer.setYGradient(graditent); 
 layer.setupTerrain(1, 0); 
 layer.setupCover(5, 3, 0, 2, 0); 
 layer.addNoiseMap(noiseMap); 
})(); 
var teleporter = dimension.getTeleporter(); 
 
var teleporterBack = teleporter.OVERWORLD; 
 alert(dimension.id);
 
IDRegistry.genItemID("blueCrystal");
Item.createItem("blueCrystal", "Blue Crystal", {name: "blue_crystal"});
Translation.addTranslation("Blue Crystal", {ru: "Голубой кристалл"});
IDRegistry.genItemID("orangeCrystal");
Item.createItem("orangeCrystal", "Orange Crystal", {name: "orange_crystal"});
Translation.addTranslation("Orange Crystal", {ru: "Оранжевый кристалл"});
 Recipes.addShaped({id: ItemID.blueCrystal, count: 1, data: 0}, ["ldl", "lsl", "ddd"], ["d", 264, -1, "d", 3, -1, "l", 18, -1, "s", 6, -1]);
Callback.addCallback("ItemUse", function(coords, item){ 
if(item.id == ItemID.blueCrystal){ 
teleporter.enter(); 
}
if(item.id == ItemID.orangeCrystal){ 
teleporterBack.enter(); 
}
});
