//INITIALIZE

const canvas = document.getElementById("myCanvas");

canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;

const ctx = canvas.getContext("2d");

const minionRadius = 15;
const minionNeighboringDistance = 2*minionRadius;//Constant used for size of circle around each Minion

var map = new Map(2000,2000);//,[new Tree([1000,1000],200)]);

var player = new Player([map.width/2,map.height/2],50,3);

const resourceMap = ["Wood"];//Which resources are available. Same order as the resources are stored in player

var keystates = [false,false,false,false];//If key is pressed. Left, Right, Up, and Down keys respectively

//HELPER FUNCTIONS

function withinScreen(pos,width,height) { //Returns if an object should be drawn or skipped. pos: board position, width: full width of object, height: full height of object
	return pos[0] < (player.pos[0]+canvas.width/2+width/2) && pos[0] > (player.pos[0]-canvas.width/2-width/2) && pos[1] < (player.pos[1]+canvas.height/2+height/2) && pos[1] > (player.pos[1]-canvas.height/2-height/2);
}

function boardXToCanvasX(posx) { //Returns board x-position's x-coordinate on the canvas
	return canvas.width/2 + (posx-player.pos[0]);
}

function boardYToCanvasY(posy) { //Returns board y-position's y-coordinate on the canvas
	return canvas.height/2 + (posy-player.pos[1]);
}

function distMagnitude([xposone,yposone],[xpostwo,ypostwo]) {
	return vectorMagnitude([xpostwo-xposone,ypostwo-yposone]);
}

function unitVector([xcomponent,ycomponent]) { //Returns unit vector of given vector
	let magnitude = vectorMagnitude([xcomponent,ycomponent]);
	return (magnitude != 0) ? [xcomponent/magnitude,ycomponent/magnitude] : [0,0];
}

function vectorMagnitude([xcomponent,ycomponent]) { //Returns magnitude of given vector
	return Math.sqrt(Math.pow(xcomponent,2)+Math.pow(ycomponent,2));
}

function vectorAdd(...paramVectors) {
	let resultVector = [0,0];
	for (let i = 0; i < paramVectors.length; i++) {
		resultVector[0] += paramVectors[i][0];
		resultVector[1] += paramVectors[i][1];
	}
	return resultVector;
}

function vectorSubtract(...paramVectors) { //Second to last vectors subtracted from first vector given
	let resultVector = paramVectors[0].slice(0);//Have to use ".slice" or else this operations is copy by reference, not value. ".slice" only performs a shallow copy
	for (let i = 1; i < paramVectors.length; i++) {
		resultVector[0] -= paramVectors[i][0];
		resultVector[1] -= paramVectors[i][1];
	}
	return resultVector;
}

function vectorDivide(vector,divisor) {
	return [vector[0]/divisor,vector[1]/divisor];
}

function vectorMultiply(vector,multiplier) {
	return [vector[0]*multiplier,vector[1]*multiplier];
}

//REYNOLD'S BOIDS HELPER FUNCTIONS

function ruleOne(minionNum) { //Cohesion towards player
	return vectorDivide(vectorSubtract(player.pos,player.minions[minionNum].pos),100);
}

function ruleTwo(minionNum) { //Separation from other Minions
	let resultVector = [0,0];
	for (let i = 0; i < player.minions.length; i++) {
		if (minionNum != i && distMagnitude(player.minions[i].pos,player.minions[minionNum].pos) < minionNeighboringDistance) {
			resultVector = vectorSubtract(resultVector,vectorSubtract(player.minions[i].pos,player.minions[minionNum].pos));
		}
	}
	return resultVector;
}

//USER INPUT

function keyDown(event) {
	let key = event.which || event.keyCode;
	if (key == 37 && keystates[0]==false) { //Left arrow key
		player.vel[0] -= 1;
		keystates[0] = true;
	} else if (key == 39 && keystates[1]==false) { //Right arrow key
		player.vel[0] += 1;
		keystates[1] = true;
	} else if (key == 38 && keystates[2]==false) { //Up arrow key
		player.vel[1] -= 1;
		keystates[2] = true;
	} else if (key == 40 && keystates[3]==false) { //Down arrow key
		player.vel[1] += 1;
		keystates[3] = true;
	}
}

function keyUp(event) {
	let key = event.which || event.keyCode;
	if (key == 37 && keystates[0]==true) { //Left arrow key. The keystates check is left in to stop unusual movement if the user loaded the page already pressing an arrow key
		player.vel[0] += 1;
		keystates[0] = false;
	} else if (key == 39 && keystates[1]==true) { //Right arrow key
		player.vel[0] -= 1;
		keystates[1] = false;
	} else if (key == 38 && keystates[2]==true) { //Up arrow key
		player.vel[1] += 1;
		keystates[2] = false;
	} else if (key == 40 && keystates[3]==true) { //Down arrow key
		player.vel[1] -= 1;
		keystates[3] = false;
	}
}

//MAP

function Map(width,height,trees=[]) { // width: int, height: int, trees: Tree[]
	this.width = width;
	this.height = height;
	this.trees = trees;
}

Map.prototype.drawLandscape = function() {
	let xcoord = (player.pos[0] >= canvas.width/2) ? 0 : canvas.width/2-player.pos[0];//Coordinate on canvas, not map
	let ycoord = (player.pos[1] >= canvas.height/2) ? 0 : canvas.height/2-player.pos[1];//Coordinate on canvas, not map
	let width = (player.pos[0]+canvas.width/2 <= this.width) ? canvas.width-xcoord : (canvas.width/2-xcoord)+(this.width-player.pos[0]);//Derived from commented code below
	let height = (player.pos[1]+canvas.height/2 <= this.height) ? canvas.height-ycoord : (canvas.height/2-ycoord)+(this.height-player.pos[1]);//Derived from commented code below
	/*EXPANDED VERSION
	let width,height;
	if(player.pos[0]+canvas.width/2<=this.width) {//If extending to right edge of the canvas
		width = canvas.width-xcoord;
	} else {
		width = (canvas.width/2-xcoord)+(this.width-player.pos[0]);
	}
	if(player.pos[1]+canvas.height/2<=this.height) {//If extending to the bottom edge of the canvas
		height = canvas.height-ycoord;
	} else {
		height = (canvas.height/2-ycoord)+(this.height-player.pos[1]);
	}*/
	ctx.fillStyle="#33cc33";
	ctx.fillRect(xcoord,ycoord,width,height);
}

Map.prototype.drawObjects = function() {
	for (let tree of this.trees) {
		tree.draw();
	}
}

//TREE

function Tree(pos,size) {
	this.pos = pos;
	this.size = size;
}

Tree.prototype.draw = function() {
	if (withinScreen(this.pos,this.size,this.size/2)) { //Only draw tree if part of it can be seen by the user
		ctx.fillStyle = "#00b300";
		ctx.fillRect(boardXToCanvasX(this.pos[0])-this.size/2, boardYToCanvasY(this.pos[1])-this.size/4, this.size, this.size/2);
	}
}

//PLAYER

function Player(pos,radius,speed) {
	this.pos = pos;
	this.vel = [0,0];
	this.radius = radius;
	this.speed = speed;
	this.minions = [];
	this.resources = [0];//Wood
}

Player.prototype.draw = function() {
	ctx.beginPath();
	ctx.fillStyle = "#ffcc00";
	ctx.arc(canvas.width/2,canvas.height/2,this.radius,0,2*Math.PI);
	ctx.fill();
	for (let i=0;i<this.minions.length;i++) {
		this.minions[i].move(i);
		this.minions[i].draw();
	}
}

Player.prototype.move = function() {
	let uVector = unitVector(this.vel);
	uVector = [uVector[0]*this.speed,uVector[1]*this.speed];
	this.pos[0] += (this.pos[0]+uVector[0]>=this.radius && this.pos[0]+uVector[0]<=map.width-this.radius) ? uVector[0] : 0;//Only apply x-movement if you stay inside the map. Derived from code below
	this.pos[1] += (this.pos[1]+uVector[1]>=this.radius && this.pos[1]+uVector[1]<=map.height-this.radius) ? uVector[1] : 0;//Only apply y-movement if you stay inside the map. Derived from code below
	/*EXPANDED VERSION
	if(this.pos[0]+uVector[0]>=this.radius && this.pos[0]+uVector[0]<=map.width-this.radius) {
		this.pos[0] += uVector[0];
	}
	if(this.pos[1]+uVector[1]>=this.radius && this.pos[1]+uVector[1]<=map.height-this.radius) {
		this.pos[1] += uVector[1];
	}*/
}

//MINIONS

function Minion(pos,color,radius=minionRadius) {
	this.pos = pos;
	this.color = color;
	this.radius = radius;
	this.maxSpeed = 2;
	this.velocity = [0,0];
}

Minion.prototype.draw = function() {
	if (withinScreen(this.pos,this.radius*2,this.radius*2)) {
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(boardXToCanvasX(this.pos[0]),boardYToCanvasY(this.pos[1]),this.radius,0,2*Math.PI);
		ctx.fill();
	}
}

Minion.prototype.move = function(minionNum) { //Parameter: What the index is for this minion in player.minions
	let v1 = ruleOne(minionNum);
	let v2 = ruleTwo(minionNum);
	//let v3 = ruleThree(minionNum);
	
	this.velocity = vectorAdd(this.velocity,v1,v2);
	this.keepInMap();
	this.limitVelocity();
	this.pos = vectorAdd(this.pos,this.velocity);
}

Minion.prototype.limitVelocity = function() {
	if (vectorMagnitude(this.velocity) > this.maxSpeed) {
		this.velocity = vectorMultiply(unitVector(this.velocity),this.maxSpeed);
	}
}

Minion.prototype.keepInMap = function() {
	if (this.pos[0] < 0) {
		this.velocity[0] = 10;
	} else if (this.pos[0] > map.width) {
		this.velocity[0] = -10;
	}
	if (this.pos[1] < 0) {
		this.velocity[1] = 10;
	} else if (this.pos[1] > map.height) {
		this.velocity[1] = -10;
	}
}

//STATS

function drawStats() {
	let pos = [10,30];
	ctx.font = "30px Arial";
	ctx.fillStyle = "black";
	for (let i=0;i<resourceMap.length;i++,pos[1]+=30) {
		ctx.fillText(resourceMap[i] + ": " + player.resources[i],pos[0],pos[1]);
	}
}

//DRAW

function draw() {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	map.drawLandscape();
	player.move();
	player.draw();
	map.drawObjects();
	drawStats();
}

player.minions = [new Minion([980,920],"orange"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([980,920],"orange"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([980,920],"orange"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([980,920],"orange"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue"),new Minion([1020,880],"blue")];

setInterval(draw,15);//Close enough to 16.666 seconds, 1000/60
