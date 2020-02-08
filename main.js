class Point {
    constructor(_x, _y) {
        this.x = _x;
        this.y = _y;
    }
    ToString(){
        return this.x+","+this.y;
    }
}
let canvas;
let canvasWidth,canvasHeight;
let controlPoints = [];
let linePoints = [];

let activePoint = null;
let mouseDown = false;
let fudgeFactor = 20;
//------------------------ Tests ----------------------------- //
//Lazy implementation of testing to avoid adding another framework. 
//lets me run tests from inspector. 
function RunAllTests() {
    //Test_AddLineSegment();
   // Test_FindNearestPoint();
   Test_Serialize();
}
function Test_AddLineSegment() {
    //assert preconditions
    linePoints = [];
    console.assert(linePoints.length == 0, { error: "Control points is not starting at 0" });
    AddLineSegment();
    console.assert(linePoints.length == 1, { error: "Not the expected number of line points" });

    console.log("Add Line Segements Passed");
    linePoints = [];
}
function Test_FindNearestPoint() {
    let p1 = new Point(10, 10)
    linePoints.push(p1);
    controlPoints.push(new Point(150, 150));
    //test true equivelence
    findNearestPoint(10, 10);
    console.log(activePoint.x);
    console.assert(activePoint === p1, { error: "Point was not found when exactly equal!" });
    console.log("Equal boundary Tested");
    //test positive click
    activePoint = null;
    findNearestPoint(10 + fudgeFactor, 10 + fudgeFactor);
    console.assert(activePoint === p1, { error: "Point was not found on a positive outer bounds" });
    console.log("positive outer bounds tested");
    //test negative click
    activePoint = null;
    findNearestPoint(10 - fudgeFactor, 10 - fudgeFactor);
    console.assert(activePoint === p1, { error: "Point was not found on a negative outer bounds" });
    console.log("Negative outer bounds tested");
    //test positive outer.
    activePoint = null;
    findNearestPoint(11 + fudgeFactor, 11 + fudgeFactor);
    console.assert(activePoint !== p1, { error: "Point was found when it shouldn't have!" });
    console.log("Error case pased");
    //test negative outer case
    activePoint = null;
    findNearestPoint(10 - fudgeFactor - 1, 10 - fudgeFactor - 1);
    console.assert(activePoint !== p1, { error: "Point was not found on a positive outer bounds" });
    console.log("negative outside bounds tested");
    console.log("Find Nearest Point Tests Passed");

}
function Test_Serialize(){
    //given a point or list of points representing a bezier sequence It should return a string that matches that sequence.
    //expected output for two points and two control points:
    let acceptable =  "M 10,50 C 10,25 100,25 200,50";
    let actual = serialize(linePoints,controlPoints);
    console.assert(actual===acceptable, {error:"Actual output differs from acceptable"});
    console.log("Passed Serialize Test");
}
//-------------------------------------------------------------//
function initialize() {
    canvas = document.getElementById("canvasArea");
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    canvas.addEventListener('mousedown', (e) => {
        handleMouseClick(canvas, e);
    });
    canvas.addEventListener('mouseup', (e) => {
        mouseDown = false;
    });
    canvas.addEventListener('mousemove', (e) => {
        handleMouseDrag(canvas, e);
    });
    //populate points.
    linePoints.push(new Point(10, 50));
    linePoints.push(new Point(canvasWidth/2, canvasHeight/2));
    controlPoints.push(new Point(10, 25));
    controlPoints.push(new Point(100, 25));
    draw();
}
function AddLineSegment() {
    let lastPointPos = linePoints.length-1;
    let newX = linePoints[lastPointPos].x + 25;
    let newY = linePoints[lastPointPos].y + 25;
    linePoints.push(new Point(newX, newY));
    controlPoints.push(new Point(newX-20, newY -20));
    draw();
}
function GeneratePath(){
    let svgContainer = document.getElementById("svgPathOut");
    let path = serialize(linePoints,controlPoints);
    svgContainer.innerText = path;
}
function findNearestPoint(x, y) {
    //eventually iterate over a list of active points and return the closest.
    //TODO: test with mouse to see if overlapping points are a pain.
    let points = controlPoints.concat(linePoints);
    let fudgeFactor = 20;
    for (let i = 0; i < points.length; i++) {
        if (points[i].x >= x - fudgeFactor
            && points[i].x <= x + fudgeFactor
            && points[i].y >= y - fudgeFactor
            && points[i].y <= y + fudgeFactor) {
            console.log("point is (" + points[i].x + "," + points[i].y + ")");
            activePoint = points[i];
            return;
        }
    }

}
function handleMouseDrag(canvas, event) {
    //console.log("DRAG "+event.clientX+" "+event.clientY);
    if (mouseDown && activePoint != null) {
        //update active point;
        let mousePoint = transformMousePos(event);
        activePoint.x = mousePoint.x;
        activePoint.y = mousePoint.y;
        draw();
    }
}
function transformMousePos(event){
    var rect = canvas.getBoundingClientRect();
    return new Point(event.clientX -rect.left, event.clientY-rect.top);
}
function handleMouseClick(canvas, event) {
    mouseDown = !mouseDown
    let mousePoint = transformMousePos(event);
    findNearestPoint(mousePoint.x,mousePoint.y);
}
function DrawPointHighlight(ctx, position, width, color) {
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.fillStyle = color;
    let xPos = position.x - width / 2;
    let yPos = position.y - width / 2;
    ctx.fillRect(xPos, yPos, width, width);

}
function DrawHintLine(ctx, point1, point2, width,color){
    ctx.beginPath();
    ctx.strokeStyle = color;
    
    ctx.moveTo(point1.x,point1.y);
    ctx.lineTo(point2.x, point2.y);
    ctx.stroke();
    
}
function serialize(listOfPoints, listOfControlPoints){
    let output = "";
    for(let i =0; i <listOfPoints.length-1; i++){
        let posString = listOfPoints[i].ToString();
        let command1 = "M "+posString;
        output = output.concat("",command1);
        //create bezier command. C cp1 cp2 pos2
        let bezierCommand = "C "+listOfControlPoints[i].ToString() +" "+listOfControlPoints[i+1].ToString()+" "+listOfPoints[i+1].ToString();
        output = output.concat(" ",bezierCommand);
    }
    return output;
}
function draw() {

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = 'rgb(255,255,255)';
    console.log("Number of Beziers: " + linePoints.length / 2);
    let numberOfBeziers = Math.ceil(linePoints.length / 2);
    for (let i = 0; i < linePoints.length; i++) {
        //draw a handle for visualization. 
        
        DrawHintLine(ctx, linePoints[i],controlPoints[i],5,'rgb(73,181,10)');
        DrawPointHighlight(ctx, linePoints[i], 7, 'rgb(30,10,181)');
        if (i < linePoints.length - 1) {
            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.moveTo(linePoints[i].x, linePoints[i].y);
            ctx.bezierCurveTo(controlPoints[i].x, controlPoints[i].y, controlPoints[i + 1].x, controlPoints[i + 1].y, linePoints[i + 1].x, linePoints[i + 1].y);
            ctx.stroke();
        }
    }
    //keeps highlights above the hint lines.
    //i.e it looks pertier
    for (let i = 0; i < controlPoints.length; i++) {
        DrawPointHighlight(ctx, controlPoints[i], 7, 'rgb(181,19,10)');
    }
    
}