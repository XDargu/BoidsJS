/*jshint esversion: 6 */

// COLORS
function rgb2hsl(color) {
    "use strict";
    var r = color[0] / 255;
    var g = color[1] / 255;
    var b = color[2] / 255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = (l > 0.5 ? d / (2 - max - min) : d / (max + min));
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return [h, s, l];
}

function hue2rgb(p, q, t) {
    "use strict";
    if (t < 0) { t += 1; }
    if (t > 1) { t -= 1; }
    if (t < 1/6) { return p + (q - p) * 6 * t; }
    if (t < 1/2) { return q; }
    if (t < 2/3) { return p + (q - p) * (2/3 - t) * 6; }
    return p;
}

function hsl2rgb(color) {
    "use strict";
  var l = color[2];

  if (color[1] === 0) {
    l = Math.round(l*255);
    return [l, l, l];
  } else {
      
    var s = color[1];
    var q = (l < 0.5 ? l * (1 + s) : l + s - l * s);
    var p = 2 * l - q;
    var r = hue2rgb(p, q, color[0] + 1/3);
    var g = hue2rgb(p, q, color[0]);
    var b = hue2rgb(p, q, color[0] - 1/3);
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
  }
}

function interpolateHSL(color1, color2, factor) {
    "use strict";
    
    if (arguments.length < 3) { factor = 0.5; }
    var hsl1 = rgb2hsl(color1);
    var hsl2 = rgb2hsl(color2);

    for (var i=0;i<3;i++) {
        hsl1[i] += factor*(hsl2[i]-hsl1[i]);
    }
    
    return hsl2rgb(hsl1);
}

// UTILS
function assert(condition, message) {
    "use strict";
    if (!condition) {
        throw message || "Assertion failed";
    }
}

function clamp(val, min, max) {
    "use strict";
	return Math.min(Math.max(val, min), max);
}

function lerp(val1, val2, amount) {
    "use strict";
	return val1 + (val2 - val1) * amount;
}

// Render

function renderText(context, position, text, font, color) {
    "use strict";
    
    cx.fillStyle = color ? color : 'black';
    cx.font = font ? font : '15px Arial';
    
    let lines = text.split("\n");
    
    for (var i = 0; i<lines.length; i++) {
        cx.fillText(lines[i], position.x, position.y + 15 * i);
    }
}

function drawArrow(context, from, to, radius, color) {
    "use strict";
    
    cx.fillStyle = color;
    cx.strokeStyle = color;
    
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
        
    drawArrowhead(context, from, to, radius);
}

function drawArrowhead(context, from, to, radius) {
    "use strict";
    
	var x_center = to.x;
	var y_center = to.y;

	var angle;
	var x;
	var y;

	context.beginPath();

	angle = Math.atan2(to.y - from.y, to.x - from.x);
	x = radius * Math.cos(angle) + x_center;
	y = radius * Math.sin(angle) + y_center;

	context.moveTo(x, y);

	angle += (1.0/3.0) * (2 * Math.PI);
	x = radius * Math.cos(angle) + x_center;
	y = radius * Math.sin(angle) + y_center;

	context.lineTo(x, y);

	angle += (1.0/3.0) * (2 * Math.PI);
	x = radius *Math.cos(angle) + x_center;
	y = radius *Math.sin(angle) + y_center;

	context.lineTo(x, y);

	context.closePath();

	context.fill();
}

var vendors = ['webkit', 'moz'];
for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
}

var canvas = document.getElementById('canvas'),
    cw = canvas.width,
    ch = canvas.height,
    cx = null,
    fps = 60,
    interval     =    1000/fps,
    lastTime     =    (new Date()).getTime(),
    currentTime  =    0,
    delta = 0;
	
var paused = false,
	stepRequested = false,
    stepBackRequested = false;

class Vector {    
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }
	
	static fromAngle(angle)
	{
		return new Vector(Math.cos(angle), Math.sin(angle));
	}
    
    zero()
    {
        this.x = 0;
        this.y = 0;
		
		return this;
    }
    
    clone()
    {
        return new Vector(this.x, this.y);
    }
    
    add(vector)
    {
        this.x += vector.x;
        this.y += vector.y;
        
        return this;
    }
    
    subtract(vector)
    {
        this.x -= vector.x;
        this.y -= vector.y;
        
        return this;
    }
    
    multiply(vector)
    {
        this.x *= vector.x;
        this.y *= vector.y;
        
        return this;
    }
    
    scale(scalar)
    {
        this.x *= scalar;
        this.y *= scalar;
        
        return this;
    }
    
    divide(vector)
    {
        this.x /= vector.x;
        this.y /= vector.y;
        
        return this;
    }
	
	clamp(min, max)
	{
		let lengthSq = this.lengthSqr();
		
		if (lengthSq > max*max)
		{
			this.normalize().scale(max);
			return this;
		}
		
		if (lengthSq < min*min)
		{
			this.normalize().scale(min);
			return this;
		}
		
		return this;
	}
    
    lengthSqr()
    {
        return this.x * this.x + this.y * this.y;
    }
    
    length()
    {
        return Math.sqrt(this.lengthSqr());
    }
    
    static distanceSqr(vector1, vector2) {
        let dx = vector1.x - vector2.x;
        let dy = vector1.y - vector2.y;
        return dx * dx + dy * dy;
    }
    
    static distance(vector1, vector2) {
        return Math.sqrt(Vector.distanceSqr(vector1, vector2));
    }
    
    normalize()
    {
        let length = this.length();
        this.x /= length;
        this.y /= length;
        
        return this;
    }
	
	lerp(vector, amount)
	{
		this.x = this.x * amount + vector.x * (1 - amount);
		this.y = this.y * amount + vector.y * (1 - amount);
		
		return this;
	}
	
	alerp(vector, amount)
	{
		let start = this.angleDeg();
		let end = vector.angleDeg();
		
		let shortest_angle=((((end - start) % 360) + 540) % 360) - 180;
		let theta = start + (shortest_angle * amount);
		
		//console.log("Start: " + start);
		//console.log("End: " + end);
		//console.log("Theta: " + theta);
		
		this.x = Math.cos(theta / 180 * Math.PI);
		this.y = Math.sin(theta / 180 * Math.PI);
		
		return this;
	}
	
	
	
	slerp(vector, amount)
	{
		let origin = this.clone().normalize();
		let target = vector.clone().normalize();
		
		let dot = Vector.dot(origin, target);
		
		if (dot < 0) {
			origin.scale(-1);
			dot = -dot;
		}
		
		let DOT_THRESHOLD = 0.9995;
		if (dot > DOT_THRESHOLD) {
			let toTarget = target.clone().subtract(origin);
			origin.add(toTarget.scale(amount));
			
			this.x = origin.x;
			this.y = origin.y;			
			this.normalize();			
			return this;
		}
		
		// Acos is safe here		
		let theta0 = Math.acos(dot);
		let theta = theta0 * amount;
		
		let sinTheta = Math.sin(theta);
		let sinTheta0 = Math.sin(theta0);
		
		let s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
		let s1 = sinTheta / sinTheta0;
		
		origin.scale(s0).add(target.scale(s1));		
		
		this.x = origin.x;
		this.y = origin.y;
		this.normalize();
		return this;
	}
	
	static dot(vector1, vector2)
	{
		return vector1.x * vector2.x + vector1.y * vector2.y;
	}
	
	static cross(vector1, vector2)
	{
		return vector1.x * vector2.y - vector1.y * vector2.x;
	}
	
	angle()
	{
		var one = new Vector(0, 1);
		var angle180 = Math.atan2(Vector.dot(this, one), Vector.cross(this, one));
		
		if (angle180 < 0)
		{
			angle180 = 2*Math.PI + angle180;
		}
		
		return angle180;
	}
	
	static unitTestAngle()
	{
		assert(new Vector(1, 0).angleDeg() === 0);
		assert(new Vector(0, 1).angleDeg() === 90);
		assert(new Vector(-1, 0).angleDeg() === 180);
		assert(new Vector(0, -1).angleDeg() === 270);
	}
	
	angleDeg()
	{
		return this.angle() / Math.PI * 180;
	}
	
	angleWith(vector)
	{
		return Math.acos( Vector.dot( this.clone().normalize(), vector.clone().normalize() ) );
	}
	
	angleWithDeg(vector)
	{
		return this.angleWith(vector) / Math.PI * 180;
	}
    
    toString()
    {
        return "(" + this.x + ", " + this.y + ")";
    }
}

// Math
function linesIntersect(position1, direction1, position2, direction2) {
    "use strict";
    let positionDiff = position1.clone().subtract(position2);
    let crossDist = Vector.cross(direction2, direction1);
    
    if (crossDist === 0) {
        return undefined;
    }
    
    let dist1 = Vector.cross(positionDiff, direction2) / crossDist;
    return position1.clone().add(direction1.clone().scale(dist1));
}

function closestPointInSegment(segmentOrigin, segmentEnd, position) {
    "use strict";
    
    let segmentLengthSqr = Vector.distanceSqr(segmentOrigin, segmentEnd);
    
    if (segmentLengthSqr === 0) { return segmentOrigin.clone(); }
    
    let t = Vector.dot(position.clone().subtract(segmentOrigin), segmentEnd.clone().subtract(segmentOrigin)) / segmentLengthSqr;
    t = Math.max(0, Math.min(1, t));
    
    let projection = segmentOrigin.add( segmentEnd.clone().subtract(segmentOrigin).scale(t) );
    return projection;
}

function distanceToSegment(segmentOrigin, segmentEnd, position) {
    "use strict";
    
    let pointInSegment = closestPointInSegment(segmentOrigin, segmentEnd, position);
    return Vector.distance(pointInSegment, position);
}

class SwarmingForce {
	constructor(transform) {
		this.force = new Vector(0, 0);
		this.transform = transform;
        this.color = 'blue';
	}
	
	update(deltaTime) {}
    
    updateForcesAtPoint(position, deltaTime) {}
	
	render() {
		if (this.force.lengthSqr() > 0) {
            
            drawArrow(cx, this.transform.position, this.transform.position.clone().add(this.force), 5, this.color);
        }
	}
}

class AwayFromSwarmersForce extends SwarmingForce {
	
	constructor(transform, swarmers, predictPosition, swarmer) {
		super(transform);
		this.swarmers = swarmers;
        this.color = 'green';
        this.predictPosition = predictPosition;
        this.mySwarmer = swarmer;
        
        this.segments = [];
	}
    
    updateForcesAtPoint(position, deltaTime) {

        let totalForce = new Vector(0, 0);
        this.segments = [];
        
        for (let i=0; i < this.swarmers.length; i++) {
			let swarmer = this.swarmers[i];
			
			if (this.transform === undefined || swarmer.transform !== this.transform)
			{
                let swarmerPosition = swarmer.transform.position.clone();
                
                if (this.predictPosition) {
                    
                    // Predic position
                    let swarmerEndPosition = swarmerPosition.clone();//.add(swarmer.transform.forward().scale(swarmer.length));
                    let futurePosition = swarmerEndPosition.clone().add(swarmer.finalForce.clone().scale(1));
                    
                    this.segments.push({ origin: swarmerPosition.clone(), end: futurePosition.clone() });
                    
                    swarmerPosition = closestPointInSegment(swarmerPosition, futurePosition, position);
                }
				
                let awayFromSwarmer = position.clone().subtract(swarmerPosition);
                
				let distance = awayFromSwarmer.length();
				awayFromSwarmer.normalize();
                
				let maxForce = 30;
				let minForce = 0;
				let distanceMaxForce = 40;
				let distanceMinForce = 200;
				
				if (distance < distanceMinForce)
				{
					let range = distanceMinForce - distanceMaxForce;
					let pointInRange = clamp(distance - distanceMaxForce, 0, range);
					let pointInRangeNormal = pointInRange / range;
					
					let force = lerp(maxForce, minForce, pointInRangeNormal);
					
					totalForce.add(awayFromSwarmer.scale(force));
				}
			}
		}
        
		return totalForce.scale(1);
    }
	
	update(deltaTime) {        
        this.force = this.updateForcesAtPoint(this.transform.position, deltaTime);
    }
    
    render() {
        super.render();
        
        let dist = 20;
        
        for (let i=0; i<this.segments.length; i++) {
            
            let normal = this.segments[i].origin.clone().subtract(this.segments[i].end).normalize();
            let angle = normal.angle();
            
            let transformOrigin = new Transform(this.segments[i].origin.x, this.segments[i].origin.y);
            transformOrigin.rotation = normal;
            
            let transformEnd = new Transform(this.segments[i].end.x, this.segments[i].end.y);
            transformEnd.rotation = normal;
            
            let rightOriginArc = transformOrigin.position.clone().add(transformOrigin.right().scale(20));
            let rightEndArc = transformEnd.position.clone().add(transformEnd.right().scale(20));
            let leftOriginArc = transformOrigin.position.clone().subtract(transformOrigin.right().scale(20));
            let leftEndArc = transformEnd.position.clone().subtract(transformEnd.right().scale(20));
            
            cx.beginPath();
            cx.strokeStyle = 'black';
            
            cx.moveTo(leftEndArc.x, leftEndArc.y);
            
            cx.arc(transformOrigin.position.x, transformOrigin.position.y, dist, angle - Math.PI * 0.5, angle + Math.PI * 0.5, false);           
            
            cx.moveTo(rightOriginArc.x, rightOriginArc.y);
            cx.lineTo(rightEndArc.x, rightEndArc.y);            
            
            cx.moveTo(leftOriginArc.x, leftOriginArc.y);
            cx.lineTo(leftEndArc.x, leftEndArc.y);
            
            cx.moveTo(rightOriginArc.x, rightOriginArc.y);
            
            cx.arc(transformEnd.position.x, transformEnd.position.y, dist, angle + Math.PI * 0.5, angle - Math.PI * 0.5, false);
            cx.stroke();
            
            
            //drawArrow(cx, transformOrigin.position, transformEnd.position, 5, 'red');
        }
    }
}

class AwayFromScreenBorder extends SwarmingForce {

    updateForcesAtPoint(position, deltaTime) {
        
        let totalForce = new Vector(0, 0);
        
        let edge = 20;
        let distanceToEdge = Math.min(position.x - edge, position.y - edge, cw - position.x - edge, ch - position.y - edge);
        
        let maxForce = 100;
        let minForce = 0;
        let distanceMaxForce = 40;
        let distanceMinForce = 100;
        
        if (distanceToEdge < distanceMinForce)
        {
            let range = distanceMinForce - distanceMaxForce;
            let pointInRange = clamp(distanceToEdge - distanceMaxForce, 0, range);
            let pointInRangeNormal = pointInRange / range;

            let force = lerp(maxForce, minForce, pointInRangeNormal);

            let screenCentre = new Vector(cw / 2, ch / 2);
            totalForce = screenCentre.subtract(position).normalize().scale(force);
        }
        
        return totalForce;
    }
    
	update(deltaTime) {
		
        this.force = this.updateForcesAtPoint(this.transform.position, deltaTime);
    }
}

class WanderForce extends SwarmingForce {
	
	constructor(transform) {
		super(transform);
		this.randomAngle = 0;
	}
		
	update(deltaTime) {
		let circleCentre = this.transform.position.clone().add(this.transform.rotation);
		
		let randomValue = Math.random() * 2 - 1;
		
		this.randomAngle += randomValue * 0.1;
		
		let circleVector = Vector.fromAngle(this.randomAngle);
		circleCentre.add(circleVector.scale(0.4142));
		
		this.force = circleCentre.clone().subtract(this.transform.position).normalize().scale(50);
    }
}

class TowardsMouseForce extends SwarmingForce {
	
    updateForcesAtPoint(position, deltaTime) {
        
        let toMouse = mousePosition.clone().subtract(position);
		return toMouse.clamp(0, 100);
    }
    
	update(deltaTime) {
        
        this.force = this.updateForcesAtPoint(this.transform.position, deltaTime);
    }
}

class AwayFromMouseForce extends SwarmingForce {
	
     updateForcesAtPoint(position, deltaTime) {
        
        let awayFromMouse = position.clone().subtract(mousePosition);
		return awayFromMouse.clamp(0, 40);
    }
    
	update(deltaTime) {
		this.force = this.updateForcesAtPoint(this.transform.position, deltaTime);
    }
}

class Transform {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.rotation = new Vector(1, 0);
    }
    
    forward() {
        return this.rotation.clone();
    }
    
    right() {
        return new Vector(-this.rotation.y, this.rotation.x);
    }
    
    render() {
        drawArrow(cx, this.position, this.position.clone().add(this.forward().scale(10)), 5, 'red');
        drawArrow(cx, this.position, this.position.clone().add(this.right().scale(10)), 5, 'blue');
    }
}

class FlowField {
    constructor(densityX, densityY) {
        this.forces = [];
        this.densityX = densityX;
        this.densityY = densityY;
    }
    
    addforce(force) {
		this.forces.push(force);
	}
    
    updateForcesAtPoint(vector, deltaTime) {
        
        let finalForce = new Vector(0, 0);		
		
		for (let i=0; i < this.forces.length; i++) {
            
            if (isOptionActiveForForce("flowForces", this.forces[i]))
            {
                let force = this.forces[i].updateForcesAtPoint(vector, deltaTime);

                if (force && force.lengthSqr() > 0)
                {
                    finalForce.add(force);
                }
            }
		}
		
        let finalForceNormal = finalForce.clone().normalize();
        let finalForceLength = finalForce.length();
        
        return finalForce;
    }
    
    render() {
        
        let gridX = cw / this.densityX;
        let gridY = ch / this.densityY;
        
        let colorRed = [255, 0, 0];
        let colorGreen = [0, 255, 0];
        
        for (let x=0; x < this.densityX; x++) {
            for (let y=0; y < this.densityY; y++) {
                
                let position = new Vector(gridX * x, gridY * y);
                
                let force = this.updateForcesAtPoint(position, 0);
                
                var value = clamp(force.length() / 100, 0, 1);
                let finalColor = interpolateHSL(colorGreen, colorRed, value);
                
                let colorString = "rgb(" + finalColor[0] + ", " + finalColor[1] + ", " + finalColor[2] + ")";
                
                drawArrow(cx, position, position.clone().add(force), 3, colorString);
            }
        }
    }
}

class Swarmer {
    constructor(x, y) {
        this.transform = new Transform(x, y);
		this.forces = [];
		this.finalForce = new Vector(0, 0);
        this.length = 0;
        this.radius = 20;
        
        this.acceleration = 5; // Pixels per second squared
        this.deceleration = 10; // Pixels per second squared
        this.speed = 0; // Pixels per second
        this.maxSpeed = 20; // Pixels per second
        
        this.debugText = "";
    }
	
	addforce(force) {
		this.forces.push(force);
	}
    
    calculateSpeed(forceLength, deltaTime) {
        let velocityChange = forceLength - this.speed;
        let accelerationPerFrame = this.acceleration * deltaTime;
        let decelerationPerFrame = this.deceleration * deltaTime;
        let velocityChangeCorrected = clamp(velocityChange, -decelerationPerFrame, accelerationPerFrame);
        
        let finalSpeed = clamp(this.speed + velocityChangeCorrected, 0, this.maxSpeed);
        
        return finalSpeed;
    }
	
	updateForces(deltaTime) {
		
		this.finalForce.zero();		
		
		for (let i=0; i < this.forces.length; i++) {
            
            if (isOptionActiveForForce("swarmerForces", this.forces[i]))
            {
                this.forces[i].update(deltaTime);

                if (this.forces[i].force.lengthSqr() > 0)
                {
                    this.finalForce.add(this.forces[i].force);
                }
            }
		}
		
        if (this.finalForce.length() < 4)
        {
            this.finalForce.zero();
        }
        
        let finalForceNormal = this.finalForce.clone().normalize();
        let finalForceLength = this.finalForce.length();
        
        let alignment = this.transform.rotation.clone();
        let velocity = this.transform.rotation.clone();
        
        if (finalForceLength > 0) {
            alignment = finalForceNormal.clone();
        }

        // Strafe when close to mouse position
        if (gameState.options.swarmerForces.towardsMouse) {
            
            let toMouse = mousePosition.clone().subtract(this.transform.position);
            
            let distanceToMouse = toMouse.length();

            if (distanceToMouse > 0 && distanceToMouse < 150) {
                toMouse.normalize();
                alignment = toMouse;
                
                if (finalForceLength > 0) {
                    velocity = finalForceNormal.clone().normalize();
                }
            }
        }
        
        this.speed = this.calculateSpeed(finalForceLength, deltaTime);
        
        let speed = this.speed * deltaTime;
        let angularSpeed = gameState.options.simulation.swarmerRotationSpeed * deltaTime;
        
        // Idle turns test
        let rotationAngle = alignment.angleWithDeg(this.transform.forward());
        let nextFrameRotation = this.transform.rotation.clone().alerp(alignment, angularSpeed);
        let nextFrameAngle = nextFrameRotation.angleWithDeg(this.transform.forward());
        this.debugText = "Final angle: " + Number.parseFloat(rotationAngle).toFixed(2) + "\nNext frame angle: " + Number.parseFloat(nextFrameAngle).toFixed(2);
        
        if (rotationAngle > 180) {
            velocity.zero();
        }
        
        this.transform.rotation.alerp(alignment, angularSpeed);
        this.transform.position.add(velocity.clone().scale(speed));
	}
    
    render() {
        
        {            
            let positionBegin = this.transform.position.clone();
            let positionEnd = this.transform.position.clone().add(this.transform.forward().scale(this.length));
            
            let angle = this.transform.rotation.angle();
            let radius = this.radius;
            
            let rightOriginArc = positionBegin.clone().add(this.transform.right().scale(radius));
            let rightEndArc = positionEnd.clone().add(this.transform.right().scale(radius));
            let leftOriginArc = positionBegin.clone().subtract(this.transform.right().scale(radius));
            let leftEndArc = positionEnd.clone().subtract(this.transform.right().scale(radius));
            
            cx.beginPath();
            cx.fillStyle = 'orange';
            
            cx.moveTo(leftEndArc.x, leftEndArc.y);
            
            cx.arc(positionBegin.x, positionBegin.y, radius, angle + Math.PI * 0.5, angle - Math.PI * 0.5, false);
            
            cx.moveTo(rightOriginArc.x, rightOriginArc.y);
            cx.lineTo(rightEndArc.x, rightEndArc.y);            
            
            cx.moveTo(leftOriginArc.x, leftOriginArc.y);
            cx.lineTo(leftEndArc.x, leftEndArc.y);
            
            cx.moveTo(rightOriginArc.x, rightOriginArc.y);
            cx.arc(positionEnd.x, positionEnd.y, radius, angle - Math.PI * 0.5, angle + Math.PI * 0.5, false);           
            
            cx.fill();
        }
		
        cx.strokeStyle = "red";
		cx.beginPath();
		cx.moveTo(this.transform.position.x, this.transform.position.y);
		cx.lineTo(this.transform.position.x + this.transform.rotation.x * (this.length + this.radius), this.transform.position.y + this.transform.rotation.y * (this.length + this.radius));
		cx.stroke();
		
        if (gameState.options.simulation.debugForces) {
            for (let i=0; i < this.forces.length; i++) {
                this.forces[i].render();
            }
            
            drawArrow(cx, this.transform.position, this.transform.position.clone().add(this.finalForce), 5, 'black');
        }
        
        renderText(cx, this.transform.position, this.debugText);
    }
}

class FPSCounter {
    constructor(updateFrequency) {
        this.accumTime = 0;
        this.fpsUpdateFrequency = updateFrequency;
        this.fps = 0;
        this.frameCount = 0;
    }
    
    update(deltaTime) {
        this.accumTime += deltaTime / gameState.options.simulation.tscale * gameState.options.simulation.simulationsPerFrame;
        this.frameCount++;
        
        if (this.accumTime >= this.fpsUpdateFrequency) {
            this.fps = this.frameCount / this.accumTime;
            this.frameCount = 0;
            this.accumTime = 0;
        }
    }
    
    render() {
        renderText(cx, new Vector(10, 20), Math.round(this.fps) + " FPS");
    }
}

class GameState {
    constructor() {
        "use strict";
        
        this.swarmers = [];
		this.step = 0;
        this.flowFields = [];
        
        this.options = {
            
            flowForces: {
                awayFromSwarmers: true,
                towardsMouse: false,
                awayFromMouse: false,
                awayFromScreenEdge: false
            },
            
            swarmerForces: {
                awayFromSwarmers: true,
                towardsMouse: false,
                awayFromMouse: false,
                awayFromScreenEdge: false,
                wander: true
            },
            
            simulation: {
                debugForces: true,
                tscale: 2,
                simulationsPerFrame: 10,
                swarmerRotationSpeed: 2
            }
        };
        
        this.fpsCounter = new FPSCounter(0.1);
    }
	
	update(deltaTime) {
		this.step++;
	}
}

var gameState = new GameState();

function init() {
    "use strict";
    
    updateOptions();
	
	for (let i=0; i<10; i++)
	{
        let x = 200 + i * 30;
        let y = 200 + i * 30;
        let isFast = i % 2 === 0;
        
        let swarmer = new Swarmer(x, y, length);
        
        if (isFast) {
            swarmer.length = 20;
            swarmer.maxSpeed = 250;
            swarmer.acceleration = 100;
            swarmer.deceleration = 200;
        }
        
		swarmer.addforce(new AwayFromScreenBorder(swarmer.transform));
		swarmer.addforce(new WanderForce(swarmer.transform));
		swarmer.addforce(new AwayFromSwarmersForce(swarmer.transform, gameState.swarmers, true, swarmer));
		swarmer.addforce(new TowardsMouseForce(swarmer.transform));
        swarmer.addforce(new AwayFromMouseForce(swarmer.transform));
		gameState.swarmers.push(swarmer);
	}
    
    let flow = new FlowField(20, 20);
    flow.addforce(new AwayFromSwarmersForce(undefined, gameState.swarmers, true, undefined));
    flow.addforce(new TowardsMouseForce(undefined));
    flow.addforce(new AwayFromScreenBorder(undefined));
    flow.addforce(new AwayFromMouseForce(undefined));
    gameState.flowFields.push(flow);
	
	// Input
	document.onkeypress = function (e) {
		e = e || window.event;
		
        console.log(e.keyCode);
		var keyMapping = {
			pause: 102,
			step: 103,
            stepBack: 100
		};
		
		if (e.keyCode === keyMapping.pause) {
			paused = !paused;
            
            if (paused)
            {
                document.body.classList.add("paused");
            }
            else
            {
                document.body.classList.remove("paused");
            }
		}
		else if (e.keyCode === keyMapping.step) {
			stepRequested = true;
		}
        else if (e.keyCode === keyMapping.stepBack) {
			stepBackRequested = true;
		}
	};
	
	window.addEventListener('mousemove', onMouseMove, false);
}

var mousePosition = new Vector(0, 0);

function getMousePos(canvas, evt) {
    "use strict";
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function onMouseMove(e) {
    "use strict";
	var pos = getMousePos(canvas, e);
	mousePosition.x = pos.x;
	mousePosition.y = pos.y;
}

function update(deltaTime) {
    "use strict";
    
	gameState.update();
	
    for (let i=0; i < gameState.swarmers.length; i++)
    {
        let swarmer = gameState.swarmers[i];        
		swarmer.updateForces(deltaTime);
    }
    
    gameState.fpsCounter.update(deltaTime);
}

function render() {
    "use strict";    
    
    for (let i=0; i < gameState.flowFields.length; i++)
    {
        var flowField = gameState.flowFields[i];
        
        flowField.render();
    }
    
    for (let i=0; i < gameState.swarmers.length; i++)
    {
        var swarmer = gameState.swarmers[i];
        
        swarmer.render();
    }
	
    renderText(cx, new Vector(10, ch - 10), "Step: " + gameState.step);
    
    gameState.fpsCounter.render();
}


function gameLoop() {
    "use strict";

    currentTime = (new Date()).getTime();
    delta = (currentTime-lastTime);
    
    if(delta > interval) {
        cx.clearRect(0, 0, cw, cw);
		let shouldUpdate = !paused || stepRequested || stepBackRequested;
		
		if (shouldUpdate)
		{
            let deltaTime = delta / 1000;
            if (stepBackRequested) { deltaTime *= -1; }
            
            for (let i=0; i<gameState.options.simulation.simulationsPerFrame; i++) {
			     update(deltaTime * gameState.options.simulation.tscale / gameState.options.simulation.simulationsPerFrame);
            }
			stepRequested = false;
            stepBackRequested = false;
		}
		
		render();
        
        lastTime = currentTime - (delta % interval);
    }
    
    window.requestAnimationFrame(gameLoop);
}

// Options
function changeOption(origin) {
    "use strict";
    
    updateOptions();
}

var options = [
    { optionType: "flowForces",  option: "awayFromSwarmers", element: "FlowAwayFromSwarmer", force: AwayFromSwarmersForce, type: "bool" },
    { optionType: "flowForces",  option: "towardsMouse", element: "FlowTowardsMouse", force: TowardsMouseForce, type: "bool" },
    { optionType: "flowForces",  option: "awayFromMouse", element: "FlowAwayFromMouse", force: AwayFromMouseForce, type: "bool" },
    { optionType: "flowForces",  option: "awayFromScreenEdge", element: "FlowAwayFromScreen", force: AwayFromScreenBorder, type: "bool" },
    
    { optionType: "swarmerForces",  option: "awayFromSwarmers", element: "SwarmAwayFromSwarmer", force: AwayFromSwarmersForce, type: "bool" },
    { optionType: "swarmerForces",  option: "towardsMouse", element: "SwarmTowardsMouse", force: TowardsMouseForce, type: "bool" },
    { optionType: "swarmerForces",  option: "awayFromMouse", element: "SwarmAwayFromMouse", force: AwayFromMouseForce, type: "bool" },
    { optionType: "swarmerForces",  option: "awayFromScreenEdge", element: "SwarmAwayFromScreen", force: AwayFromScreenBorder, type: "bool" },
    { optionType: "swarmerForces",  option: "wander", element: "SwarmWander", force: WanderForce, type: "bool" },
    
    { optionType: "simulation",  option: "debugForces", element: "DebugForces", type: "bool" },
    { optionType: "simulation",  option: "tscale", element: "TimeScale", type: "float" },
    { optionType: "simulation",  option: "simulationsPerFrame", element: "SimulationsPerFrame", type: "int" },
    { optionType: "simulation",  option: "swarmerRotationSpeed", element: "SwarmerRotationSpeed", type: "float" }
];

function updateOptions() {
    "use strict";
    
    for (let i=0; i < options.length; i++)
    {
        var option = options[i];
        
        if (option.type === "bool") {        
            gameState.options[option.optionType][option.option] = document.getElementById(option.element).checked;
        }
        else if (option.type === "float") {        
            let value = parseFloat(document.getElementById(option.element).value);
            
            if (!isNaN(value)) {
                gameState.options[option.optionType][option.option] = value;
            }
        }
        else if (option.type === "int") {        
            let value = parseFloat(document.getElementById(option.element).value);
            
            if (!isNaN(value)) {
                gameState.options[option.optionType][option.option] = value;
            }
        }
    }
}

function isOptionActiveForForce(type, force) {
    "use strict";
    
    for (let i=0; i < options.length; i++)
    {
        var option = options[i];
        
        if (type === option.optionType)
        {
            if (option.force && force instanceof option.force)
            {
                return gameState.options[option.optionType][option.option];
            }
        }
    }
    
    return true;
}


if (typeof (canvas.getContext) !== undefined) {
    cx = canvas.getContext('2d');

    init();
    gameLoop();
}