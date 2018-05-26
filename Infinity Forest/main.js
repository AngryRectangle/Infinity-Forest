/*
BUILD INFO:
  dir: dev
  target: main.js
  files: 2
*/



// file: index.js

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




// file: objectGenerator.js

var cottage = FileTools.ReadJSON(__dir__+"/objects/cottage.json");
var bigOak = FileTools.ReadJSON(__dir__+"/objects/bigOak.json");
var logBundle = FileTools.ReadJSON(__dir__+"/objects/logsBundle.json");
var oak_1 = FileTools.ReadJSON(__dir__+"/objects/oak_1.json");
var oak_2 = FileTools.ReadJSON(__dir__+"/objects/oak_2.json");
var birch = FileTools.ReadJSON(__dir__+"/objects/birch.json");
var chest = FileTools.ReadJSON(__dir__+"/objects/chest.json");

var generateItems =[
];
function addItemsToGenerateChest(id, random, count, data){
	random = random||1;
	count = count||{};
	count.min = count.min||1;
	count.max = count.max||1;
	data = data||0;
	generateItems.push({id:id, data:data, random:random, count:count});
}
addItemsToGenerateChest(264, 0.2, {max:3});
addItemsToGenerateChest(388, 0.3, {max:5});
addItemsToGenerateChest(265, 0.8, {max:16});
addItemsToGenerateChest(266, 0.7, {max:13});
addItemsToGenerateChest(6, 1, {max:16});
addItemsToGenerateChest(17, 1, {max:16});
addItemsToGenerateChest(341, 0.7, {max:8});
addItemsToGenerateChest(ItemID.orangeCrystal, 0.3);

function fillChest(x,y,z){
	var container = World.getContainer(x, y, z);
	var size = container.getSize();
	var random = Math.random();
	var slot = 0;
	for(var i in generateItems){
		if(random<generateItems[i].random){
			var count = Math.floor(Math.random()*(generateItems[i].count.max-generateItems[i].count.min))+generateItems[i].count.min;
			container.setSlot(slot, generateItems[i].id, count, generateItems[i].data);
			slot++;
		}
	}
}

function setRotationObject(array,coords){
	var rotation = Math.floor(Math.random()*4);
	for(var i in array){
		switch(rotation){
			case 0:
				var x = array[i].x;
				var y = array[i].y;
				var z = array[i].z;
				break;
			case 1:
				var x = array[i].z;
				var y = array[i].y;
				var z = array[i].x;
				break;
			case 2:
				var x = -array[i].x;
				var y = array[i].y;
				var z = array[i].z;
				break;
			case 3:
				var x = -array[i].z;
				var y = array[i].y;
				var z = array[i].x;
				break;
		}
		if(World.getBlock(x+coords.x,y+coords.y,z+coords.z).id==0){
			World.setBlock(x+coords.x,y+coords.y,z+coords.z, array[i].id, array[i].data);
		}
	}
}

function setObject(array,coords, bool){
	var rotation = Math.floor(Math.random()*4);
	//if(bool===undefined)bool=true;
	for(var i in array){
		var x = array[i].x;
		var y = array[i].y;
		var z = array[i].z;
		if(!bool||World.getBlock(x+coords.x,y+coords.y,z+coords.z).id==0){
			var id = array[i].id;
			var data = array[i].data;
			if(id==17){
				if(data==2){
					id = BlockID.pinkLog;
					data=0;
				}else if(data==0){
					id = BlockID.eucalyptusLog;
				}else if(data==4){
					id = BlockID.eucalyptusLog;
					data=1;
				}else if(data==8){
					id = BlockID.eucalyptusLog;
					data=2;
				}else if(data==6){
					id = BlockID.pinkLog;
					data=1;
				}else if(data==10){
					id = BlockID.pinkLog;
					data=2;
				}
			}
			if(id==5){
				data = 2;
			}
			if(id==85){
				data=2;
			}
			if(id==53){
				id=135; 
			}
			if(id==18){
				data=1;
			}
			World.setBlock(x+coords.x,y+coords.y,z+coords.z, id, data);
		}
	}
}

function getChunkBound(array){
	xmin = 0;
	xmax = 0;
	ymin = 0;
	ymax = 0;
	zmin = 0;
	zmax = 0;
	for(var i in array){
		var x = array[i].x;
		var y = array[i].y;
		var z = array[i].z;
		if(x<xmin){
			xmin = x;
		}
		if(x>xmax){
			xmax = x;
		}
		if(y<ymin){
			tmin = y;
		}
		if(y>ymax){
			ymax = y;
		}
		if(z<zmin){
			zmin = z;
		}
		if(z>zmax){
			zmax = z;
		}
	}
	return {min:{x:xmin, y:ymin, z:zmin}, max:{x:xmax, y:ymax, z:zmax}};
}

function gS(x,z){
	for(var y = 128; y>20; y--){
		if(World.getBlock(x,y-1,z).id==2){
			return y;
		}
	}
}

Callback.addCallback("GenerateChunk", function(chunkX, chunkZ){
	if(Player.getDimension()==dimension.id){
	var random = Math.random()*1000;
	if(random<50){
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords = GenerationUtils.findSurface(coords.x, coords.y, coords.z);
	setObject(cottage,coords, false);
	var bound = getChunkBound(cottage);
	for(var x = Math.floor((bound.min.x+coords.x)/16)*16; x<=Math.floor(bound.max.x+coords.x)*16;x+=16){
		for(var y = Math.floor((bound.min.y+coords.y)/16)*16; y<=Math.floor(bound.max.y+coords.y)*16;y+=16){
			for(var z = Math.floor((bound.min.z+coords.z)/16)*16; z<=Math.floor(bound.max.z+coords.z)*16;z+=16){
				BlockRenderer.forceRenderRebuild(x,y,z,0);
			}
		}
	}
	}else if(random<80){
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords = GenerationUtils.findSurface(coords.x, coords.y, coords.z);
	setObject(bigOak,coords, false);
	var bound = getChunkBound(bigOak);
	for(var x = Math.floor((bound.min.x+coords.x)/16)*16; x<=Math.floor(bound.max.x+coords.x)*16;x+=16){
		for(var y = Math.floor((bound.min.y+coords.y)/16)*16; y<=Math.floor(bound.max.y+coords.y)*16;y+=16){
			for(var z = Math.floor((bound.min.z+coords.z)/16)*16; z<=Math.floor(bound.max.z+coords.z)*16;z+=16){
				BlockRenderer.forceRenderRebuild(x,y,z,0);
			}
		}
	}
	}else if(random<120){
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords = GenerationUtils.findSurface(coords.x, coords.y, coords.z);
		coords.y++;
	setObject(logBundle,coords, false);
	var bound = getChunkBound(logBundle);
	for(var x = Math.floor((bound.min.x+coords.x)/16)*16; x<=Math.floor(bound.max.x+coords.x)*16;x+=16){
		for(var y = Math.floor((bound.min.y+coords.y)/16)*16; y<=Math.floor(bound.max.y+coords.y)*16;y+=16){
			for(var z = Math.floor((bound.min.z+coords.z)/16)*16; z<=Math.floor(bound.max.z+coords.z)*16;z+=16){
				BlockRenderer.forceRenderRebuild(x,y,z,0);
			}
		}
	}
	}else if(random<160){
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords = GenerationUtils.findSurface(coords.x, coords.y, coords.z);
	setObject(chest,coords, false);
	var bound = getChunkBound(chest);
	for(var x = Math.floor((bound.min.x+coords.x)/16)*16; x<=Math.floor(bound.max.x+coords.x)*16;x+=16){
		for(var y = Math.floor((bound.min.y+coords.y)/16)*16; y<=Math.floor(bound.max.y+coords.y)*16;y+=16){
			for(var z = Math.floor((bound.min.z+coords.z)/16)*16; z<=Math.floor(bound.max.z+coords.z)*16;z+=16){
				BlockRenderer.forceRenderRebuild(x,y,z,0);
			}
		}
	}
	fillChest(coords.x, coords.y+8, coords.z);
	}else{
	for(var i = 0; i<=4; i++){
		var random = Math.floor(Math.random()*3);
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords.y = gS(coords.x, coords.z);
		if(random==0){
			setObject(oak_1,coords, false);;
	var bound = getChunkBound(oak_1);
	for(var x = Math.floor(bound.min.x/16+coords.x)*16; x<=Math.floor(bound.max.x/16+coords.x)*16;x+=16){
		for(var y = Math.floor(bound.min.y/16+coords.y)*16; y<=Math.floor(bound.max.y/16+coords.y)*16;y+=16){
			for(var z = Math.floor(bound.min.z/16+coords.z)*16; z<=Math.floor(bound.max.z/16+coords.z)*16;z+=16){
				BlockRenderer.forceRenderRebuild(x,y,z,0);
			}
		}
	}
		}else if(random==1){
			setObject(oak_2,coords, false);;
	var bound = getChunkBound(oak_2);
	for(var x = Math.floor(bound.min.x/16+coords.x)*16; x<=Math.floor(bound.max.x/16+coords.x)*16;x+=16){
		for(var y = Math.floor(bound.min.y/16+coords.y)*16; y<=Math.floor(bound.max.y/16+coords.y)*16;y+=16){
			for(var z = Math.floor(bound.min.z/16+coords.z)*16; z<=Math.floor(bound.max.z/16+coords.z)*16;z+=16){
				BlockRenderer.forceRenderRebuild(x,y,z,0);
			}
		}
	}
	}else if(random==2){
			setObject(birch,coords, false);;
	var bound = getChunkBound(birch);
	for(var x = Math.floor(bound.min.x/16+coords.x)*16; x<=Math.floor(bound.max.x/16+coords.x)*16;x+=16){
		for(var y = Math.floor(bound.min.y/16+coords.y)*16; y<=Math.floor(bound.max.y/16+coords.y)*16;y+=16){
			for(var z = Math.floor(bound.min.z/16+coords.z)*16; z<=Math.floor(bound.max.z/16+coords.z)*16;z+=16){
				BlockRenderer.forceRenderRebuild(x,y,z,0);
			}
		}
	}
	}
	}
	}
	if(Math.random()<0.07){
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords.y = gS(coords.x, coords.z);
		if(World.getBlock(coords.x, coords.y, coords.z).id==0){
		World.setBlock(coords.x, coords.y, coords.z, BlockID.fironia);
		World.addTileEntity(coords.x, coords.y, coords.z);
		BlockRenderer.forceRenderRebuild(coords.x, coords.y, coords.z,0);
		}
	}
	for(var i = 0; i<=6; i++){
		var random = Math.floor(Math.random()*2);
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords.y = gS(coords.x, coords.z);
		if(World.getBlock(coords.x, coords.y, coords.z).id==0){
		if(random==0){
			World.setBlock(coords.x, coords.y, coords.z, 39);
		}else{
			World.setBlock(coords.x, coords.y, coords.z, 40);
		}
		}
	}
	for(var i = 0; i<=20; i++){
		var random = Math.floor(Math.random()*40);
		var coords = GenerationUtils.randomCoords(chunkX, chunkZ, 1, 256);
		coords.y = gS(coords.x, coords.z);
		if(World.getBlock(coords.x, coords.y, coords.z).id==0){
		if(random==1){
			World.setBlock(coords.x, coords.y, coords.z, 37);
		}else if(random <=10){
			World.setBlock(coords.x, coords.y, coords.z, 38, random-2);
		}else if(random<=30){
			World.setBlock(coords.x, coords.y, coords.z, 31,1);
		}else{
			World.setBlock(coords.x, coords.y, coords.z, 31,2);
		}
		}
	}
	}
});






