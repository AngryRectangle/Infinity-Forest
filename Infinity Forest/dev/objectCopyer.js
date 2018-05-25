var firstClick = true;
var origin = {x:0, y:0, z:0};
var gs = ModAPI.requireGlobal("Entity.isSneaking");
var blockArray;
var coordinates=[{},{}];
Callback.addCallback("ItemUse", function(coords, item){ 
if(item.id == 263&&gs(Player.get())){ 
	origin = coords;
}else
if(item.id == 263&&!gs(Player.get())){
	if(!firstClick){
		coordinates[1] = coords;
		Game.message("second click");
	}else{
		Game.message("first click");
		coordinates[0]=coords;
	}
	firstClick = firstClick?false:true;
}
});

Callback.addCallback("NativeCommand", function (str) {
	if(str == "/write"){
		blockArray = [];
		for(var x = Math.min(coordinates[0].x, coordinates[1].x); x<=Math.max(coordinates[0].x, coordinates[1].x);x++){
			for(var z = Math.min(coordinates[0].z, coordinates[1].z); z<=Math.max(coordinates[0].z, coordinates[1].z);z++){
				for(var y = Math.min(coordinates[0].y, coordinates[1].y); y<=Math.max(coordinates[0].y, coordinates[1].y);y++){
					if(World.getBlock(x,y,z).id!=0)blockArray.push({x:x-origin.x,y:y-origin.y,z:z-origin.z, id:World.getBlock(x,y,z).id, data: World.getBlock(x,y,z).data});
				}
			}
		}
		FileTools.WriteJSON (__dir__+"/temporary.json", blockArray, false);
	}
});
