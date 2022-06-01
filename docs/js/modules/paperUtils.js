import { DS } from './init.js';
import { clamp, softRoundPointY, projectPointToLine } from './mathUtils.js';
import { noteToFrequency, setOscillatorParams } from './audio.js';



function getItemsByName(parent, className, nameIncludes, guide){
    return parent.getItems({guide, className, match(item){
        if(item && item.name != null)
            return item.name.includes(nameIncludes)
        else return false
    }})
}

const getTimeForProjectedPoint = function (pt1, pt2, ptProject) {
    let projected = projectPointToLine(pt1, pt2, ptProject)
    let p1 = projected.subtract(pt1)
    let p2 = pt2.subtract(pt1)
    return p1.length / p2.length
}

const getTouchTiltXY = touch => {
    return [
        Math.atan(Math.cos(touch.azimuthAngle) / Math.tan(touch.altitudeAngle)) / Math.PI * 2,
        Math.atan(Math.sin(touch.azimuthAngle) / Math.tan(touch.altitudeAngle)) / Math.PI * 2
    ]
}

function exportProject() {
    let obj = project.exportJSON({ asString: false })
    obj[1][0][1].children = obj[1][0][1].children.filter(x => !x[1].guide)
    obj[1][0][1].children.forEach(x => delete x[1].data)
    return obj
}

function importProject() {
    let localProject = window.localStorage.getItem('dimsyn')
    if (localProject) {
        project.clear()
        project.importJSON(localProject)
        let items = project.getItems({ guide: false, className: "Path" })
        items.forEach(item => {
            let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', { outputChannelCount: [2] });
            osc.connect(audioCtx.destination)
            item.data = {
                osc
            }
        })
    }
}

function importSVG(str) {
    project.clear()
    project.importSVG(str)
    let items = project.getItems({ guide: false, className: "Path" })
    items.forEach(item => {
        let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', { outputChannelCount: [2] });
        osc.connect(audioCtx.destination)
        item.data = {
            osc
        }
    })
}

function importSVGCB(svgString) {
    let svg = project.importSVG(svgString)
    svg.clipped = false;
    svg.scale(1,-1, new Point(0,640))
    svg.children[0].remove()
    let items = svg.parent.insertChildren(svg.index, svg.removeChildren());
    svg.remove();    
    items.forEach(item => {
        if (item.className == "SymbolItem") {
            let childItems = item.definition.item.getItems({ className: "Path" })
            item.definition.item.data = {}
            item.definition.item.data.players = []
        }
    })

    getItemsByName(project, "Path", "track", false).forEach(item => item.guide = true)
    getItemsByName(project, "Path", "playhead", false).forEach(item => item.guide = true)
}

function exportSVG() {
    let items = project.getItems({ guide: false, className: "Path" })
    items.forEach(item => {
        item.data = {}
    })
    let rect = new Path.Rectangle({
        from: [0, 0],
        to: [2560, 1280]
    })
    let group = new Group([rect, ...items], { insert: false })
    let proj = group.exportSVG({ asString: true })
    return proj
}


function createTouchPath(frame) {
    return new Path({
        applyMatrix: false,
        strokeColor: "cyan",
        strokeWidth: 2,
        guide: true,
        data: {
            startFrame: frame
        }
    })
}

const createPlayGroup = (x, y, width, height) => {
    let playgroup = new Group({
        name: "playgroup"
    })
    let playhead = new Path({
        //guide: true,
        strokeColor: "cyan",
        strokeWidth: 1,
        name: "playhead",
        segments: [[x,y],[x,y+height]]
    })
    let track = new Path({
        //guide: true,
        closed: true,
        segments:[[x,y],[x+width,y],[x+width,y+height],[x,y+height]],
        strokeColor: "cyan",
        strokeWidth: 1,
        dashArray: [2,4],
        name: "track"
    })
    playgroup.appendTop(track)
    playgroup.appendTop(playhead)
    return playgroup
}

const createNotePath = function (e, selected) {
    return new Path({
        applyMatrix: false,
        strokeWidth: DS.yPixelScale / 2,
        strokeColor: {
            gradient: {
                stops: [[project.currentStyle.strokeColor, 0], [project.currentStyle.strokeColor, 0]]
            }
        },
        // disable for now as the bug persists https://github.com/LLK/paper.js/pull/40/files
        //strokeScaling: false,
        selected,
        segments: [softRoundPointY(e.point, DS.yPixelScale)],
        data: { pointerIds: [] }
    })
}

function paramsFromColor(col){
    let noise = clamp(col.red + col.green + col.blue - 2, 0, 1);
    return {
        midpoint: clamp(1 - col.green, 0.01, 0.99),
        curvature: clamp(col.red, 0.01, 0.99),
        noise,
        resonance: 1 - noise / 8,
    }
}

function intersectItem(touchPath, item, intersectionCount, pressure, osc, rampDuration) {
    let intersections = item.getIntersections(touchPath)
    let ampScale = item.strokeWidth / DS.yPixelScale;
    let col = new Color(0, 0, 1, 1)

    if (item.strokeColor) {
        if (item.strokeColor.gradient) {
            let gradTime = getTimeForProjectedPoint(item.strokeColor.origin, item.strokeColor.destination, intersections[0].point)
            col = item.getGradientColorAtX(clamp(gradTime, 0, 1))
        }
        else col = item.strokeColor
    }
    const {midpoint, curvature, noise, resonance} = paramsFromColor(col)

    let yCoord = item.localToGlobal(intersections[0].point).y 
    let pan = ((DS.activeIDs.indexOf(item.id)) / DS.activeIDs.length) - 0.5;
    const amp = clamp(ampScale * col.alpha / (intersectionCount / 2), 0, 0.5)
    let frequency = noteToFrequency(yCoord / DS.yPixelScale + DS.noteOffset);
    setOscillatorParams({
        osc, context: audioCtx, amp, pan, frequency, midpoint, curvature, noise, rampDuration,
        resonance
    })
}

const getCanvasItems = () => 
    project.getItems({
        guide: false, 
        className: "Path", 
        match: function(item){
            return (item.name != 'playhead' && item.name != 'track')
        }
    })

function updateUndo(){
    ds.previousProject = ds.currentProject
    ds.currentProject = project.exportJSON({asString: true})
    
    if(ds.previousProject != null && ds.currentProject != ds.previousProject){
        ds.undoPosition = clamp(ds.undoPosition + 1, 0, Math.min(ds.undoBuffer.length+1, DS.MAX_UNDOS))

        console.log('undo pos '+ds.undoPosition)
        ds.undoBuffer.splice(ds.undoPosition)
        ds.undoBuffer.push(ds.currentProject)
        if(ds.undoBuffer.length > DS.MAX_UNDOS)
            ds.undoBuffer.shift()
    }

}

export {
    getItemsByName, getTimeForProjectedPoint, getTouchTiltXY, exportProject, importProject,
    importSVG, importSVGCB, exportSVG, createTouchPath,
    createNotePath, intersectItem, createPlayGroup, getCanvasItems, updateUndo
}