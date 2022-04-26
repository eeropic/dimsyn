paper.install(window);
paper.setup('canvas');

const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;

const lerpPoints = (pt0, pt1, t) => new Point(lerp(pt0.x, pt1.x, t), lerp(pt0.y,pt1.y,t))

Color.prototype.lerpGradientPosition = function(t){
    return new Point(
        lerp(this.origin.x, this.destination.x, t),
        lerp(this.origin.y, this.destination.y, t)
    )    
}

// source http://www.vcskicks.com/code-snippet/point-projection.php
function projectPointToLine(pt0, pt1, pt){
    let m = (pt1.y - pt0.y) / (pt1.x - pt0.x);
    let b = pt0.y - (m * pt0.x);
    let x = (m * pt.y + pt.x - m * b) / (m * m + 1);
    let y = (m * m * pt.y + m * pt.x + b) / (m * m + 1);
    return new Point(x,y);
}

const getTimeForProjectedPoint = function(pt1, pt2, ptProject){
    let projected = projectPointToLine(pt1,pt2,ptProject)
    let p1 = projected.subtract(pt1)
    let p2 = pt2.subtract(pt1)
    return p1.length / p2.length
}

const debugLine = function(pt1,pt2,color){
    let delta = pt2.subtract(pt1)
    return new Path({
        strokeColor:(color || "blue"),
        segments: [
            pt1,
            pt2,
            pt2.add(delta.normalize(10).rotate(-135)),
            pt2,
            pt2.add(delta.normalize(10).rotate(135))]
    })
}

const debugDot = function(pt, color){
    return new Shape.Circle({
        fillColor:(color || "blue"),
        radius: 5,
        position: pt
    })
}

const getTouchTiltXY = touch => {
    return [
        Math.atan(Math.cos(touch.azimuthAngle) / Math.tan(touch.altitudeAngle)) / Math.PI * 2,
        Math.atan(Math.sin(touch.azimuthAngle) / Math.tan(touch.altitudeAngle)) / Math.PI * 2
    ]
}

Segment.prototype.getNormalizedX = function(){
    return (this.point.x - this.path.bounds.left) / this.path.bounds.width;
}

Path.prototype.lerp = function(t){
    return new Point(
        lerp(this.segments[0].point.x, this.segments[1].point.x, t),
        lerp(this.segments[0].point.y, this.segments[1].point.y, t)
    )
}

Path.prototype.matchGradientToSegments = function(){
    this.strokeColor.origin = this.bounds.leftCenter
    this.strokeColor.destination = this.bounds.rightCenter
    this.segments.forEach((seg,i) => {
        seg.setGradientStopOffsetToPoint()
    })
}

Path.prototype.matchGradientToBounds = function(){
    this.strokeColor.origin = this.bounds.leftCenter
    this.strokeColor.destination = this.bounds.rightCenter
    this.strokeColor.transform(this.matrix)
}

Path.prototype.getNormalizedX = function(x){
    return (x - this.bounds.left) / this.bounds.width;
}

Path.prototype.getGradientColorAtX = function(x){
    let grad = this.strokeColor.gradient
    if (grad && grad._stops) {
        let stops = grad._stops;
        if(x == 0 || x <= grad._stops[0]._offset){
            return stops[0]._color
        }
        else if(x == 1 || x >= grad._stops.slice(-1)[0]._offset){
            return stops.slice(-1)[0]._color
        }
        else {
            let stop1 = stops.filter(stop => stop._offset < x).slice(-1)[0];
            let stop2 = stops.filter(stop => stop._offset >= x)[0];
            if(typeof stop1 !== "undefined" && typeof stop2 !== "undefined"){
                let xNormalized = x == 0 ? 0 : (x - stop1._offset) / (stop2._offset - stop1._offset);
                return new Color(
                    lerp(stop1._color.components[0], stop2._color.components[0], xNormalized),
                    lerp(stop1._color.components[1], stop2._color.components[1], xNormalized),
                    lerp(stop1._color.components[2], stop2._color.components[2], xNormalized),
                    lerp(stop1._color.alpha, stop2._color.alpha, xNormalized)
                )
            }
            else {
                return new Color(1,0,1,1)
            }
        }
    }
};

Path.prototype.simplifyGradient = function(){
    let gradient = new Gradient()
    gradient.stops = this.segments.map( (seg,idx) => {
        let xPos = seg.getNormalizedX()
        let col = this.getGradientColorAtX(xPos)        
        return new GradientStop(col, xPos)
    })
    this.strokeColor.gradient = gradient
}

Segment.prototype.setGradientStopOffsetToPoint = function(){
    this.path.strokeColor.gradient.stops[this.index].offset = this.getNormalizedX()
}

Path.prototype.resetStrokeGradientStops = function(){
    this.strokeColor.gradient = new Gradient()
    this.strokeColor.gradient.stops = new Array(this.segments.length).fill(new GradientStop())
}

Path.prototype.setStrokeGradientStops = function(stops){
    this.resetStrokeGradientStops()
    stops.forEach((stop,i) => {
        let idx = Math.min(i,this.segments.length-1)
        this.strokeColor.gradient.stops[idx].color = stop
        this.strokeColor.gradient.stops[idx].offset = this.segments[i].getNormalizedX()
    })
}

Path.prototype.addGradientPoint = function(point,color){
    this.add(point)
    this.strokeColor.gradient.stops.push(new GradientStop(color, 1))
    if(this.bounds.width>0)
        this.matchGradientToSegments()
}

Path.prototype.setDragPivot = function(point){
    this.pivot = this.globalToLocal(point)
}

Path.prototype.setDragPivotX = function(point){
    this.pivot.x = this.globalToLocal(point).x
}

Path.prototype.setDragPivotY = function(point){
    this.pivot.y = this.globalToLocal(point).y
}

Path.prototype.resetPivot = function(){
    this.pivot = this.bounds.center
}

function exportProject(){
    let obj = project.exportJSON({asString:false})
    obj[1][0][1].children = obj[1][0][1].children.filter(x=>!x[1].guide)
    obj[1][0][1].children.forEach(x => delete x[1].data)
    return obj
}

function importProject(){
    let localProject = window.localStorage.getItem('dimsyn')
    if(localProject){
        project.clear()
        project.importJSON(localProject)
        let items = project.getItems({guide: false,className: "Path"})
        items.forEach(item => {
            let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
            osc.connect(audioCtx.destination)
            item.data = {
                osc
            }
        })
    }
}

function importSVG(str){
    project.clear()
    project.importSVG(str)
    let items = project.getItems({guide: false,className: "Path"})
    items.forEach(item => {
        let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
        osc.connect(audioCtx.destination)
        item.data = {
            osc
        }
    })
}

function importSVGCB(svgString){

    //let items = project.getItems({guide: false,className: "Path"})
    //items.forEach(item => item.remove())
    let svg=project.importSVG(svgString)
    svg.clipped=false;
    svg.children[0].remove()
    let items = svg.parent.insertChildren(svg.index,svg.removeChildren());
    svg.remove();

//  items = project.getItems({guide: false, className: "Path"})
    items.forEach(item => {
        if(item.className == "SymbolItem"){
            let childItems = item.definition.item.getItems({className: "Path"})
            item.definition.item.data = {}
            item.definition.item.data.players = []
            childItems.forEach(childItem => {
                if(typeof childItem.data.osc == 'undefined'){
                    let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
                    osc.connect(audioCtx.destination)
                    childItem.data = {osc}
                }
            })
        }
        else if(item.className == "Path"){
            let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
            osc.connect(audioCtx.destination)
            item.data = {osc}
        }
    })
}

function createTouchPath(frame){
    return new Path({
        applyMatrix: false,
        strokeColor:"cyan",
        strokeWidth: 8,
        guide:true,
        data: {
            startFrame: frame
        }
    })
}

const roundPointY = (pt,grid) => new Point(pt.x,Math.round(pt.y/grid)*grid)

const softRoundPointY = (pt,grid) => {
    return new Point(
        pt.x,
        Math.floor(pt.y/grid)*grid + Tween.easings.easeInOutCubic((pt.y % grid) / grid) * grid
    )
}

const clamp = (val, min, max) => Math.max(min, Math.min(val, max))

const mapValue = (val, inMin, inMax, outMin, outMax, invert = false) => {
    let inputRange = inMax - inMin
    let outputRange = outMax - outMin
    let inputValue = val - inMin
    let inputValueNormalized = inputValue / inputRange
    let factor = invert ? 1 - inputValueNormalized : inputValueNormalized
    return clamp(factor * outputRange + outMin, outMin, outMax)
}

