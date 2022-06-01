const lerp = (v0, v1, t) => v0 * (1 - t) + v1 * t;

const lerpPoints = (pt0, pt1, t) => new Point(lerp(pt0.x, pt1.x, t), lerp(pt0.y, pt1.y, t))

// source http://www.vcskicks.com/code-snippet/point-projection.php
function projectPointToLine(pt0, pt1, pt) {
    let m = (pt1.y - pt0.y) / (pt1.x - pt0.x);
    let b = pt0.y - (m * pt0.x);
    let x = (m * pt.y + pt.x - m * b) / (m * m + 1);
    let y = (m * m * pt.y + m * pt.x + b) / (m * m + 1);
    return new Point(x, y);
}

const roundPointY = (pt, grid) => new Point(pt.x, Math.round(pt.y / grid) * grid)

const softRoundPointY = (pt, grid) => {
    return new Point(
        pt.x,
        Math.floor(pt.y / grid) * grid + Tween.easings.easeInOutCubic((pt.y % grid) / grid) * grid
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

export { lerp, clamp, mapValue, lerpPoints, projectPointToLine, roundPointY, softRoundPointY }