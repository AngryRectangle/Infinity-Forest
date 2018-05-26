var CustomDimension = ModAPI.requireGlobal("CustomDimension"); 
var Noise = ModAPI.requireGlobal("Noise"); 
var DimensionTerrainLayer = ModAPI.requireGlobal("DimensionTerrainLayer"); 
 
var dimension = new CustomDimension("testDimension"); 
 dimension.setGlobalBiome(1);
 dimension.setDecorationEnabled(false);
 dimension.setDefaultBiomeCoverEnabled(false);
 dimension.setSkyColor(.05,.2, .3);
 dimension.setFogColor(0, .6, .3);
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
 
IDRegistry.genBlockID("eucalyptusLog");
Block.createBlock("eucalyptusLog", [
	{name: "Eucaluptus", texture: [["eucalyptus", 0], ["eucalyptus", 0], ["eucalyptus", 1], ["eucalyptus", 1], ["eucalyptus", 1], ["eucalyptus", 1]], inCreative: true},
	{name: "Eucaluptus", texture: [["eucalyptus", 1], ["eucalyptus", 1], ["eucalyptus", 1], ["eucalyptus", 1], ["eucalyptus", 0], ["eucalyptus", 0]], inCreative: false},
	{name: "Eucaluptus", texture: [["eucalyptus", 1], ["eucalyptus", 1], ["eucalyptus", 0], ["eucalyptus", 0], ["eucalyptus", 1], ["eucalyptus", 1]], inCreative: false}
], "opaque");
Block.registerDropFunction("eucalyptusLog", function(coords, blockID){
	return [[BlockID.eucalyptusLog, 1, 0]];
});
Block.setDestroyTime(BlockID.eucalyptusLog, 0.4);
ToolAPI.registerBlockMaterial(BlockID.eucalyptusLog, "wood");
Translation.addTranslation("Eucaluptus", {ru: "Эвкалипт"});
IDRegistry.genBlockID("pinkLog");
Block.createBlock("pinkLog", [
	{name: "Pink Wood", texture: [["pinkWood", 0], ["pinkWood", 0], ["pinkWood", 1], ["pinkWood", 1], ["pinkWood", 1], ["pinkWood", 1]], inCreative: true},
	{name: "Pink Wood", texture: [["pinkWood", 1], ["pinkWood", 1], ["pinkWood", 1], ["pinkWood", 1], ["pinkWood", 0], ["pinkWood", 0]], inCreative: false},
	{name: "Pink Wood", texture: [["pinkWood", 1], ["pinkWood", 1], ["pinkWood", 0], ["pinkWood", 0], ["pinkWood", 1], ["pinkWood", 1]], inCreative: false}
], "opaque");
Block.registerDropFunction("pinkLog", function(coords, blockID){
	return [[BlockID.pinkLog, 1, 0]];
});
Recipes.addShaped({id: 5, count: 4, data: 2}, ["vvv", "vlv", "vvv"], ["l", BlockID.pinkLog, -1]);
Recipes.addShaped({id: 5, count: 4, data: 2}, ["vvv", "vlv", "vvv"], ["l", BlockID.eucalyptusLog, -1]);
Block.setDestroyTime(BlockID.pinkLog, 0.4);
ToolAPI.registerBlockMaterial(BlockID.pinkLog, "wood");
Translation.addTranslation("Pink Wood", {ru: "Розовое Дерево"});
Callback.addCallback("ItemUse", function(coords, item){ 
if(item.id == ItemID.blueCrystal){ 
teleporter.enter(); 
}
if(item.id == ItemID.orangeCrystal){ 
teleporterBack.enter(); 
}
});


var Particles = ModAPI.requireGlobal("Particles");

var glowworm = Particles.registerParticleType({
 texture: "part_1",
 render: 2,
 size:[1, 3],
 lifetime:[40, 100],
 
 animators: {
  alpha:{fadeIn: .4, fadeOut: .4},
  size:{fadeOut: .5, fadeIn:0.2, start:0, end:0}
 }
});
var fire = Particles.registerParticleType({
 texture: "part_1",
 render: 2,
 color:[1,.5,.5],
 size:[2, 4],
 lifetime:[40, 100],
 
 animators: {
  alpha:{fadeIn: .4, fadeOut: .4},
  size:{fadeOut: .5, fadeIn:0.2, start:0, end:0}
 }
});

/*Updatable.addUpdatable({
   emitter: new Particles.ParticleEmitter(coords.vec.x, coords.vec.y, coords.vec.z),
   update: function() {
    this.emitter.setVelocity(0, 0, 0);
    this.emitter.setEmitRelatively(true);
    this.emitter.emit(par1, 0, 0, 0, 0, (Math.random() - .5) * .015, Math.random() * 0.025, (Math.random() - .5) * .015)
   }
  });*/
  function getSign(n){
	  if(n>0)return 1;
	  if(n==0)return 0;
	  if(n<0)return -1;
  }
  function random(min, max){
	  var rnd = Math.random();
	  var dot = getSign(Math.random()*2-1);
	  return Math.floor(rnd*(max-min)*dot+min*dot);
  }
function getMinDistance(min, max){
	var x = random(0,max);
	var z = random(0,max);
	if(x*x+z*z>min*min){
		return {x:x, z:z};
	}else{
		return getMinDistance(min, max);
	}
}
function addGlowworm(){
	var xz = getMinDistance(10,30);
	var x = xz.x;
	var y = random(0,1);
	var z = xz.z;
	var xz = getMinDistance(3,5);
	var xV = xz.x/80;
	var yV = random(3,5)/600;
	var zV = xz.z/80;
	
		Particles.addFarParticle(glowworm,Player.getPosition().x+x, Player.getPosition().y+y, Player.getPosition().z+z,xV,yV,zV,0);
}
function addFire(){
	var xz = getMinDistance(30,80);
	var x = xz.x;
	var y = random(0,1);
	var z = xz.z;
	var xz = getMinDistance(3,5);
	var xV = xz.x/80;
	var yV = random(3,5)/600;
	var zV = xz.z/80;
	
		Particles.addFarParticle(fire,Player.getPosition().x+x, Player.getPosition().y+y, Player.getPosition().z+z,xV,yV,zV,0);
}
var BLOCK_TYPE_FIRE = Block.createSpecialType({
	lightlevel:6
});
IDRegistry.genBlockID("fironia");
Block.createBlock("fironia", [
	{name: "Fironia", texture: [["fironia",0]], inCreative: true}
],BLOCK_TYPE_FIRE);
Translation.addTranslation("Fironia", {ru: "Огнецвет"});
Block.setBlockShape(BlockID.fironia, 
			{x: 0, y: 0, z: 0}, 
			{x: 1, y: 0.001, z: 1}
		);
		BlockRenderer.addRenderCallback(BlockID.fironia, function(api, coords,block) {	
			api.renderBoxId(coords.x, coords.y, coords.z, 0.4999, 0.01, 0, 0.5, 0.99, 1, BlockID.fironia, 0);											
			api.renderBoxId(coords.x, coords.y, coords.z, 0, 0.01, 0.4999, 1, 0.99, 0.5, BlockID.fironia, 0);										
		});
		BlockRenderer.enableCustomRender(BlockID.fironia);
		TileEntity.registerPrototype(BlockID.fironia, {
			tick:function(){
				if(Math.random()<0.5){
					Particles.addFarParticle(7,this.x+.45+Math.random()/10, this.y+.75+Math.random()/10, this.z+.45+Math.random()/10, 0, 0, 0,1);
				}
			}
			});
Callback.addCallback("tick", function(coords, item){ 
	if(Player.getDimension()==dimension.id){
		World.setWorldTime(13400);
	}
	addGlowworm();
	for(var i = 0; i<2; i++){
		addFire();
	}
});
