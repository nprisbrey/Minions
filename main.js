//INITIALIZE

const canvas = document.getElementById("myCanvas");

canvas.width = document.body.clientWidth;
canvas.height = document.body.clientHeight;

const ctx = canvas.getContext("2d");

const repelConstant = 2;//Constant used for reversing minion vectors

var map = new Map(2000,2000)//,[new Tree(1000,1000,200)]);

var player = new Player(map.width/2,map.height/2,50,3);

const resourceMap = ["Wood"];//Which resources are available. Same order as the resources are stored in player

var keystates = [false,false,false,false];//If key is pressed. Left, Right, Up, and Down keys respectively

//HELPER FUNCTIONS

function withinScreen(posx,posy,width,height) { //Returns if an object should be drawn or skipped. posx: board x-position, posy: board y-position, width: full width of object, height: full height of object
	return posx < (player.posx+canvas.width/2+width/2) && posx > (player.posx-canvas.width/2-width/2) && posy < (player.posy+canvas.height/2+height/2) && posy > (player.posy-canvas.height/2-height/2);
}

function boardXToCanvasX(posx) { //Returns board x-position's x-coordinate on the canvas
	return canvas.width/2 + (posx-player.posx);
}

function boardYToCanvasY(posy) { //Returns board y-position's y-coordinate on the canvas
	return canvas.height/2 + (posy-player.posy);
}

function distVector([xposone,yposone],[xpostwo,ypostwo],reverseVector=false,radii=[0,0],speed=0) { //Vector from the first location to second location, puts the vector through -1 * 1/n * repelConstant function if reverseVector is true
	let xcomponent = (reverseVector) ? -(xpostwo-xposone) : xpostwo-xposone;
	let ycomponent = (reverseVector) ? -(ypostwo-yposone) : ypostwo-yposone;
	let uVector = unitVector([xcomponent,ycomponent]);
	xcomponent -= (radii[0]+radii[1]) * uVector[0];
	ycomponent -= (radii[0]+radii[1]) * uVector[1];
	return [xcomponent,ycomponent];
}

function unitVector([xcomponent,ycomponent]) { //Returns unit vector of given vector
	let magnitude = vectorMagnitude([xcomponent,ycomponent]);
	return (magnitude != 0) ? [xcomponent/magnitude,ycomponent/magnitude] : [0,0];
}

function vectorMagnitude([xcomponent,ycomponent]) { //Returns magnitude of given vector
	return Math.sqrt(Math.pow(xcomponent,2)+Math.pow(ycomponent,2));
}

//USER INPUT

function keyDown(event) {
	let key = event.which || event.keyCode;
	if (key == 37 && keystates[0]==false) { //Left arrow key
		player.velx -= 1;
		keystates[0] = true;
	} else if (key == 39 && keystates[1]==false) { //Right arrow key
		player.velx += 1;
		keystates[1] = true;
	} else if (key == 38 && keystates[2]==false) { //Up arrow key
		player.vely -= 1;
		keystates[2] = true;
	} else if (key == 40 && keystates[3]==false) { //Down arrow key
		player.vely += 1;
		keystates[3] = true;
	}
}

function keyUp(event) {
	let key = event.which || event.keyCode;
	if (key == 37 && keystates[0]==true) { //Left arrow key. The keystates check is left in to stop unusual movement if the user loaded the page already pressing an arrow key
		player.velx += 1;
		keystates[0] = false;
	} else if (key == 39 && keystates[1]==true) { //Right arrow key
		player.velx -= 1;
		keystates[1] = false;
	} else if (key == 38 && keystates[2]==true) { //Up arrow key
		player.vely += 1;
		keystates[2] = false;
	} else if (key == 40 && keystates[3]==true) { //Down arrow key
		player.vely -= 1;
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
	let xcoord = (player.posx >= canvas.width/2) ? 0 : canvas.width/2-player.posx;//Coordinate on canvas, not map
	let ycoord = (player.posy >= canvas.height/2) ? 0 : canvas.height/2-player.posy;//Coordinate on canvas, not map
	let width = (player.posx+canvas.width/2 <= this.width) ? canvas.width-xcoord : (canvas.width/2-xcoord)+(this.width-player.posx);//Derived from commented code below
	let height = (player.posy+canvas.height/2 <= this.height) ? canvas.height-ycoord : (canvas.height/2-ycoord)+(this.height-player.posy);//Derived from commented code below
	/*EXPANDED VERSION
	let width,height;
	if(player.posx+canvas.width/2<=this.width) {//If extending to right edge of the canvas
		width = canvas.width-xcoord;
	} else {
		width = (canvas.width/2-xcoord)+(this.width-player.posx);
	}
	if(player.posy+canvas.height/2<=this.height) {//If extending to the bottom edge of the canvas
		height = canvas.height-ycoord;
	} else {
		height = (canvas.height/2-ycoord)+(this.height-player.posy);
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

function Tree(x,y,size) {
	this.posx = x;
	this.posy = y;
	this.size = size;
}

Tree.prototype.draw = function() {
	if (withinScreen(this.posx,this.posy,this.size,this.size/2)) { //Only draw tree if part of it can be seen by the user
		ctx.fillStyle = "#00b300";
		ctx.fillRect(boardXToCanvasX(this.posx)-this.size/2, boardYToCanvasY(this.posy)-this.size/4, this.size, this.size/2);
	}
}

//PLAYER

function Player(x,y,radius,speed) {
	this.posx = x;
	this.posy = y;
	this.velx = 0;
	this.vely = 0;
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
	let uVector = unitVector([this.velx,this.vely]);
	uVector = [uVector[0]*this.speed,uVector[1]*this.speed];
	this.posx += (this.posx+uVector[0]>=this.radius && this.posx+uVector[0]<=map.width-this.radius) ? uVector[0] : 0;//Only apply x-movement if you stay inside the map. Derived from code below
	this.posy += (this.posy+uVector[1]>=this.radius && this.posy+uVector[1]<=map.height-this.radius) ? uVector[1] : 0;//Only apply y-movement if you stay inside the map. Derived from code below
	/*EXPANDED VERSION
	if(this.posx+uVector[0]>=this.radius && this.posx+uVector[0]<=map.width-this.radius) {
		this.posx += uVector[0];
	}
	if(this.posy+uVector[1]>=this.radius && this.posy+uVector[1]<=map.height-this.radius) {
		this.posy += uVector[1];
	}*/
}

//MINIONS

function Minion(x,y,color,radius=20) {
	this.posx = x;
	this.posy = y;
	this.color = color;
	this.radius = radius;
	this.speed = 2;
	this.fixed = [false];//Changes between [false] and [true,[player.posx,player.posy]]
}

Minion.prototype.draw = function() {
	if (withinScreen(this.posx,this.posy,this.radius*2,this.radius*2)) {
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(boardXToCanvasX(this.posx),boardYToCanvasY(this.posy),this.radius,0,2*Math.PI);
		ctx.fill();
	}
}

Minion.prototype.move = function(minionNum) { //What the index is for this minion in player.minions
	console.log(this.fixed[0] == false || this.fixed[0] && (this.fixed[1][0] != player.posx || this.fixed[1][1] != player.posy));
	if (this.fixed[0] == false || this.fixed[0] && (this.fixed[1][0] != player.posx || this.fixed[1][1] != player.posy)) {
		this.fixed = [false];
		let goalVector = distVector([this.posx,this.posy],[player.posx,player.posy],false,[this.radius,player.radius],this.speed);
		let avoidanceVector = [0,0];
		let shortestMagnitude = [NaN,NaN];
		for (let i = 0;i<player.minions.length;i++) {
			if (i != minionNum) { //Make sure that the minion isn't comparing itself to itself
				let absVector = distVector([this.posx,this.posy],[player.minions[i].posx,player.minions[i].posy]);
				let radiiSum = this.radius+player.minions[i].radius;
				if (vectorMagnitude(absVector) < radiiSum) {
					player.minions[i].posx += (Math.random() < 0.5) ? -radiiSum : radiiSum;
					player.minions[i].posy += (Math.random() < 0.5) ? -radiiSum : radiiSum;
				}
				let tempVector = distVector([this.posx,this.posy],[player.minions[i].posx,player.minions[i].posy],true,[this.radius,player.minions[i].radius]);
				if (isNaN(shortestMagnitude[0]) || vectorMagnitude(tempVector)<shortestMagnitude[0]) {
					shortestMagnitude[0] = vectorMagnitude(tempVector);
					shortestMagnitude[1] = player.minions[i];
				}
				avoidanceVector[0] += 100/tempVector[0];
				avoidanceVector[1] += 100/tempVector[1];
			}
		}
		if (!isNaN(shortestMagnitude[1]) && shortestMagnitude[1].fixed[0] && shortestMagnitude[1].fixed[1][0] == player.posx && shortestMagnitude[1].fixed[1][1] == player.posy) { //Nearest minion not moving anymore
			this.fixed = [true,[player.posx,player.posy]];
		} else {
			avoidanceVector = (player.minions.length > 1) ? [avoidanceVector[0]/player.minions.length-1,avoidanceVector[1]/player.minions.length-1] : [0,0];
			let repelPercentage = (!isNaN(shortestMagnitude[0])) ? (-Math.tanh((shortestMagnitude[0]-repelConstant*4)/(repelConstant*3))+1)/2 : 0;
			if (vectorMagnitude(goalVector) <= this.speed) {
				this.fixed = [true,[player.posx,player.posy]];
				return;
			}
			let avoidanceUVector = unitVector(avoidanceVector);
			let goalUVector = unitVector(goalVector);
			let finalUVector = unitVector([avoidanceUVector[0]*repelPercentage+goalUVector[0]*(1-repelPercentage),avoidanceUVector[1]*repelPercentage+goalUVector[1]*(1-repelPercentage)]);
			this.posx += this.speed * finalUVector[0];
			this.posy += this.speed * finalUVector[1];
		}
	}
}

//STATS

function drawStats() {
	let xpos = 10;
	let ypos = 30;
	ctx.font = "30px Arial";
	ctx.fillStyle = "black";
	for (let i=0;i<resourceMap.length;i++,ypos+=30) {
		ctx.fillText(resourceMap[i] + ": " + player.resources[i],xpos,ypos);
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

player.minions = [new Minion(980,920,"orange",5),new Minion(1020,880,"blue",10),new Minion(1020,880,"blue",15),new Minion(1020,880,"blue",20),new Minion(1020,880,"blue",25)];

setInterval(draw,15);//Close enough to 16.666 seconds, 1000/60
