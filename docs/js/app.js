import { DS } from './modules/init.js';
import { clamp } from './modules/mathUtils.js';
import './modules/paperOverrides.js';
import './modules/paperUtils.js';
import {debugDot, debugLine, debugText} from './modules/debugUtils.js';
import { lerp, lerpPoints } from './modules/mathUtils.js';
import { initAudioContext } from './modules/audio.js';
import { elementById, createTools } from './modules/domUtils.js';
import DimTool from './modules/DimTool.js';
import { setActiveTool } from './modules/tools.js';
import { initGUI } from './modules/gui.js';
import { importSVGCB, intersectItem, getItemsByName, createPlayGroup, getCanvasItems, updateUndo } from './modules/paperUtils.js';

const OSC_FADE_TIME = 0.02

const { canvas, gui, startbuttons, startworklet } = elementById

var [audioCtx, oscArray] = initAudioContext();
var toolStack = createTools(DS)

setActiveTool(toolStack, "pencil")

if(audioCtx.state != "running")
    startbuttons.classList.toggle("hidden")

startworklet.onclick = function(e){
    audioCtx.resume();
    startbuttons.classList.toggle("hidden")
}

view.scale(1,-1)

view.translate(0,-240)

initGUI()

window.ds = DS

ds.playgroup = createPlayGroup(0,view.bounds.top,view.viewSize.width,view.viewSize.height)

updateUndo()

function lerpPlayhead(playhead, t){
    //playhead.segments[5].point.x = (e.time * 400) % 400
    //playhead.segments[6].point.x = (e.time * 400) % 400

    let start1 = playhead.segments[0]
    let start2 = playhead.segments[3]
    let end1 = playhead.segments[1]
    let end2 = playhead.segments[2]

    let loopLen = (start1.point.getDistance(end1.point) + start2.point.getDistance(end2.point)) / 2

    playhead.segments[5].point = lerpPoints(start1.point, end1.point, t)
    playhead.segments[6].point = lerpPoints(start2.point, end2.point, t)

}

function adjustPlaygroup(playgroup, playPosition){
    let tracks = getItemsByName(playgroup, "Path", "track", false)
    let playheads = getItemsByName(playgroup, "Path", "playhead", false)

    let t = playPosition / 60
    
    if(tracks.length && playheads.length){
        let playhead = playheads[0]
        if(tracks.length == 1){
            if(tracks[0].closed){
                let tlen = tracks[0].length
                let tlen1 = tracks[0].firstCurve.length
                let tlen2 = tracks[0].lastCurve.length
                let t1 = (t*300) % tlen1
                let t2 = (t*300) % (tracks[0].lastCurve.previous.length)
                playhead.segments[0].point = tracks[0].getPointAt(tracks[0].getLocationAt(t1))
                playhead.segments[1].point = tracks[0].getPointAt(tracks[0].getLocationAt(tlen - tlen2 - t2))                         
            }
            else {
                let tVal = (t*300) % tracks[0].length
                playhead.position = tracks[0].getPointAt(tVal)
            }
        }
        else if (tracks.length == 2){
            let t1 = (t*300) % tracks[0].length
            let t2 = (t*300) % tracks[1].length
            playhead.segments[0].point = tracks[0].getPointAt(t1)
            playhead.segments[1].point = tracks[1].getPointAt(t2)
        }
    }
}


view.autoUpdate = true
view.onFrame = function (e) {
    if(DS.playing){
        DS.playPosition += 1
        let playgroups = getItemsByName(project, "Group", "playgroup", false)
        if(playgroups.length){
            playgroups.forEach(group => {
                adjustPlaygroup(group, DS.playPosition)
            })
        }
    }

    let playheads = getItemsByName(project, "Path", "playhead", false)
    let items = getCanvasItems()

    items.forEach(item => {
        let playhead = playheads.filter(playhead => item.intersects(playhead))[0]
        if(playhead && playhead.opacity == 1){
            if(DS.activeIDs.indexOf(item.id) == -1)
                DS.activeIDs.push(item.id)
            
            // find next available oscillator or the use existing with same id
            let oscObject = oscArray.filter(oscillator => oscillator.id == null)
            let existingOscy = oscArray.filter(oscillator => oscillator.id == item.id)

            if(oscObject.length && !existingOscy.length){
                oscObject[0].id = item.id
                intersectItem(playhead, item, DS.activeIDs.length, 1, oscObject[0], OSC_FADE_TIME)
            }
            else if(existingOscy.length){
                intersectItem(playhead, item, DS.activeIDs.length, 1, existingOscy[0], OSC_FADE_TIME)           
            }
        }
        else {
            DS.activeIDs = DS.activeIDs.filter(id => id != item.id)
            let _osc = oscArray.filter(oscillator => oscillator.id == item.id)
            if(_osc.length){
                _osc[0].id = null
                let amp = _osc[0].amp
                amp.cancelScheduledValues(audioCtx.currentTime)
                amp.setTargetAtTime(0,audioCtx.currentTime, OSC_FADE_TIME)                    
            }
        }
    })

}


const getElementOffset = elem => {
    let rect = elem.getBoundingClientRect();
    var offset = {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
    };
    return offset
}

let mainTool = new DimTool({
    eventTypes: ['keydown', 'keyup', 'wheel', 
    'gesturestart','gesturechange','gestureend',
    'pointerdown','pointerup','pointercancel',
    'touchstart','copy','paste'],
    eventHandler: {
        copy(e){
            e.event.preventDefault()
            console.log(exportSVG())
        },
        paste(e){
            //e.preventDefault()
            importSVGCB(e.event.clipboardData.getData('text/plain'))        
        },
        pointerdown(e){
        },
        pointermove(e){

        },
        pointerup(e){
            
        },
        gesturestart(e){
            e.event.preventDefault()
            this.viewScaling = new Point(view.scaling.x, view.scaling.y)
            this.viewCenter = new Point(view.center.x, view.center.y)
            this.gestureStartPointView = new Point(e.point.x,e.point.y)
            this.gestureStartPointNative = new Point(e.event.clientX, e.event.clientY)
            this.gesturePosPrev = new Point(e.event.clientX, e.event.clientY)
            this.gesturePosCurr = new Point(e.event.clientX, e.event.clientY)
        },
        gesturechange(e){
            e.event.preventDefault()
            // pinch to zoom
            this.gesturePosPrev = this.gesturePosCurr
            this.gesturePosCurr = new Point(e.event.clientX, e.event.clientY)
            let delta = this.gesturePosCurr.subtract(this.gesturePosPrev)

            if(this.touches.length == 2 && project.selectedItems.length == 0){
                view.center = this.viewCenter
                view.scaling = this.viewScaling
                view.scale(e.event.scale, this.gestureStartPointView)
                this.viewCenter.x -= delta.x / view.getZoom()
                this.viewCenter.y -= -delta.y / view.getZoom()
            }
        },
        gestureend(e){
            e.event.preventDefault()
        },
        keydown(e){
            if(e.event.key == "Meta"){
                console.log('current '+toolStack.currentTool)
                console.log('previous '+toolStack.previousTool)
                setActiveTool(toolStack, "selection")
            }
        },
        keyup(e){
            console.log(e)
            if(e.event.key == "Meta"){
                console.log('current '+toolStack.currentTool)
                console.log('previous '+toolStack.previousTool)                
                setActiveTool(toolStack, toolStack.previousTool)
            }
            if(e.event.code == "Space"){
                ds.playing = !ds.playing
                elementById.play.checked = ds.playing
                let playheads = getItemsByName(project, "Path", "playhead", false)
                playheads.forEach(item => {
                    console.log(item)
                    if(ds.playing)
                        item.opacity = 1
                    else item.opacity = 0.5
                })
            }
        },
        contextmenu(e){
            e.event.preventDefault()
        },
        wheel(e){
            // TODO handle the native pointer event and additional props somehow (native paper points for each event)
            e.event.preventDefault();
            e.event.stopPropagation();
            if (!e.event.shiftKey && !e.event.ctrlKey) {
            }
            else if (e.event.shiftKey && !e.event.ctrlKey) {
                view.translate(-e.event.deltaX, e.event.deltaY)
                view.center = new Point(
                    clamp(view.center.x, 320, 640),
                    clamp(view.center.y, 0, 1280)
                )
            }
            else if (!e.event.shiftKey && e.event.ctrlKey) {
                let offset = getElementOffset(canvas),
                    point = view.viewToProject(
                        new Point(e.event.offsetX, e.event.offsetY).subtract(offset.left, offset.top)
                    ),
                    delta = e.event.deltaY || 0,
                    scale = 1 - delta / 100;
                view.scale(scale, point);
                view.scaling.x = clamp(view.scaling.x, 0.25, 4.0)
                view.scaling.y = clamp(view.scaling.y, -4.0, -0.25)
            }
        }
    },
    targetElement: window
})

mainTool.activate()

elementById.triangle.checked = true
project.currentStyle.strokeColor = "#0000FF"

var ws = new WebSocket("wss://" + location.host);
ws.onopen = function() {
  console.log('WebSocket connection opened')
};
ws.onmessage = function (evt) { 
    let dat = JSON.parse(evt.data)
};
