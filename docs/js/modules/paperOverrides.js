const clamp = (val, min, max) => Math.max(min, Math.min(val, max))

paper.install(window)
paper.setup('canvas');

const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;

const lerpPoints = (pt0, pt1, t) => new Point(lerp(pt0.x, pt1.x, t), lerp(pt0.y,pt1.y,t))

Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};

Color.prototype.lerpGradientPosition = function(t){
    return new Point(
        lerp(this.origin.x, this.destination.x, t),
        lerp(this.origin.y, this.destination.y, t)
    )    
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

Path.prototype.setGradientColorAtSegment = function(segIndex, color){
    let grad = this.strokeColor.gradient
    if (grad && grad.stops) {
        let stopIndex = clamp(segIndex, 0, grad._stops.length)
        grad.stops[stopIndex].color = color
    }
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