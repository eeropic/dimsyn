const debugDot = (pt, fillColor = "cyan") => new Shape.Circle({ fillColor, radius: 5, position: pt })

const debugLine = (pt1, pt2, strokeColor = "cyan") => {
    let delta = pt2.subtract(pt1)
    return new Path({
        strokeColor,
        segments: [
            pt1,
            pt2,
            pt2.add(delta.normalize(10).rotate(-135)),
            pt2,
            pt2.add(delta.normalize(10).rotate(135))]
    })
}

const debugText = (content,position) => {
    let pointText = new PointText({content, fontSize: 16, fillColor:"white", position })
    pointText.scale(1,-1)
    return pointText
}

export {debugDot, debugLine, debugText}