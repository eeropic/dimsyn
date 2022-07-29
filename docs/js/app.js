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
import { exportSelectedSVG, importSVGCB, intersectItem, getItemsByName, createPlayGroup, getCanvasItems, updateUndo } from './modules/paperUtils.js';

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

//view.translate(0,-240)

initGUI()

window.ds = DS

ds.playgroup = createPlayGroup(0,view.bounds.top,2560,1280)


// let pg1 = createPlayGroup(0,view.bounds.bottom - view.viewSize.height/4,view.viewSize.width/4,view.viewSize.height/4)

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

    let t = playPosition / 60 * ds.PPQ * 5
    
    if(tracks.length && playheads.length){
        let playhead = playheads[0]
        if(tracks.length == 1){
            if(tracks[0].closed){
                let tlen = tracks[0].length
                let tlen1 = tracks[0].firstCurve.length
                let tlen2 = tracks[0].lastCurve.length
                let t1 = t % tlen1
                let t2 = t % (tracks[0].lastCurve.previous.length)
                playhead.segments[0].point = tracks[0].getPointAt(tracks[0].getLocationAt(t1))
                playhead.segments[1].point = tracks[0].getPointAt(tracks[0].getLocationAt(tlen - tlen2 - t2))                         
            }
            else {
                let tVal = t % tracks[0].length
                playhead.position = tracks[0].getPointAt(tVal)
            }
        }
        else if (tracks.length == 2){
            let t1 = t % tracks[0].length
            let t2 = t % tracks[1].length
            playhead.segments[0].point = tracks[0].getPointAt(t1)
            playhead.segments[1].point = tracks[1].getPointAt(t2)
        }
    }
}

/*
((context.currentTime - toolDraw.startTime) * (BPM / 60) * PPQ) % seqLength;
*/

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
        if(playhead){
            if(playhead.opacity == 1){
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
        }
        else {
            DS.activeIDs = DS.activeIDs.filter(id => id != item.id)
            item.opacity = 0.5
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
    eventTypes: ['wheel','keydown', 'keyup', 
    'pointerdown','pointerup','pointercancel',
    'gesturestart','gesturechange','gestureend','wheel',
    'touchstart','copy','paste'],
    eventHandler: {
        copy(e){
            e.event.preventDefault()
            let projectSVGString = exportSelectedSVG()
            navigator.clipboard.writeText(projectSVGString).then(function() {
                console.log('wrote selected items to clipboard')
              }, function() {
                console.log('clipboard set failed')
            });
        },
        paste(e){
            //e.preventDefault()
            let clipboardText = e.event.clipboardData.getData('text/plain')
            if(clipboardText.includes('svg')){
                importSVGCB(e.event.clipboardData.getData('text/plain'))   
            }     
        },
        pointerdown(e){
        },
        pointermove(e){

        },
        pointerup(e){
            
        },
        gesturestart(e){
            e.event.preventDefault()            
        },
        gesturechange(e){
            e.event.preventDefault()            
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
            if(!isNaN(parseInt(e.event.key))){
                ds.playPosition = (parseInt(e.event.key) - 1) * 40
                adjustPlaygroup(ds.playgroup, ds.playPosition)
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

            ds.playPosition += e.event.deltaX / 5
            adjustPlaygroup(ds.playgroup, ds.playPosition)
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
