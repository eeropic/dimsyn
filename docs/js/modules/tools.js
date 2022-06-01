import { DS } from './init.js';
import { debugDot, debugLine, debugText } from './debugUtils.js';
import { createNotePath, getCanvasItems, updateUndo } from './paperUtils.js';
import { softRoundPointY } from './mathUtils.js';

const drawingTools = {
    playhead: {
        eventHandler: {
            pointerdown(e) {
                if(this.playhead == null){
                    this.playhead = new Path({
                        strokeWidth: 1,
                        strokeColor: "cyan",
                        name: "playhead",
                        guide: false,
                        segments: [[200,0],[0,600]]
                    })
                }
                this.playhead.opacity = 1.0
                this.playhead.position = e.point
            },
            pointermove(e) {
                if(this.playhead && e.event.buttons)
                    this.playhead.position = e.point
            },
            pointerup(e) {
                if(this.playhead){
                    this.playhead.opacity = 0.5
                }
            }
        },
        description: "Playhead tool"
    },
    selection: {
        eventHandler: {
            pointerdown(e) {
                if(e.hit && e.hit.item){
                    if(e.hit.type === "segment")
                        e.hit.segment.selected = true
                    else if(e.hit.type === "stroke")
                        e.hit.item.selected = true
                    
                    project.selectedItems.forEach(item => {
                        item.setDragPivot(e.point)
                        item.data.rotation = item.rotation
                        item.data.scaling = item.scaling
                        item.data.pointerId = e.event.pointerId
                    })
                }
                else {
                    project.deselectAll()
                    if(this.marqueePath == null){
                        this.marqueePath = new Path({
                            strokeWidth: 1,
                            strokeColor: "cyan",
                            name: "playhead",
                            closed: true,
                            guide: true,
                            dashArray: [2,2],
                            segments: [e.point, e.point, e.point, e.point]
                        })
                    }
                }
            },
            pointermove(e) {
                if(this.previousPoint == null)
                    this.previousPoint = e.point
                if(this.currentPoint == null)
                    this.currentPoint = e.point
                
                this.previousPoint = this.currentPoint
                this.currentPoint = e.point
                this.deltaPoint = this.currentPoint.subtract(this.previousPoint)

                if(e.event.buttons){
                    project.selectedItems.forEach(item => {
                        if(e.event.pointerId == item.data.pointerId){
                            let selectedSegments = item.segments.filter(seg => seg.selected)
                            if(selectedSegments.length == 0){
                                item.position = e.point
                            }
                            else {
                                selectedSegments.forEach(seg => {
                                    seg.point = seg.point.add(this.deltaPoint)
                                })
                            }
                        }

                    })
                    if(this.marqueePath){
                        this.marqueePath.segments[1].point.x = e.point.x
                        this.marqueePath.segments[2].point.x = e.point.x
                        this.marqueePath.segments[2].point.y = e.point.y
                        this.marqueePath.segments[3].point.y = e.point.y
                    }
                }
            },
            pointerup(e) {
                if(this.marqueePath){
                    let items = getCanvasItems()

                    items.forEach(item => {
                        if(item.isInside(this.marqueePath.bounds)){
                            item.selected = true
                        }
                    })
                    this.marqueePath.remove()
                    this.marqueePath = null
                }
            }
        },
        description: "Select tool"
    },
    pencil: {
        eventTypes: ['gesturechange','pointerdown','pointermove','pointerup'],
        eventHandler: {
            gesturechange(e){
                project.selectedItems.forEach(item => {
                    item.rotation = item.data.rotation - e.event.rotation
                    item.scaling = item.data.scaling.multiply(e.event.scale)
                    //console.log(item.pivot, item.position)
                    //item.position = e.point
                    //item.position = e.point.subtract(item.globalToLocal(item.pivot))
                })
            },
            pointerdown(e) {
                if(e.event.pointerType == "touch"){
                    if(e.hit && e.hit.item){
                        if(this.touches.length == 1){
                            e.hit.item.selected = true
                            project.selectedItems.forEach(item => {
                                item.setDragPivot(e.point)
                                item.data.rotation = item.rotation
                                item.data.scaling = item.scaling
                                item.data.pointerId = e.event.pointerId
                            })
                        }
                    }
                    else {
                        if(this.touches.length == 1)
                            project.deselectAll()
                    }
                }
                else {
                    this.path = createNotePath(e,false)
                }
            },
            pointermove(e) {
                if(e.event.pointerType == "touch"){
                    if(this.touches.length <= 2){
                        project.selectedItems.forEach(item => {
                            if(e.event.pointerId == item.data.pointerId)
                                item.position = e.point
                        })
                    }
                }
                else {
                    if(e.event.buttons && this.path){
                        let tiltX = e.event.tiltX || 0
                        let tiltY = e.event.tiltY || 0
                        let valZ = e.event.pressure || drawTool.webkitForce % 1;
                        //if(valZ == 0.5)valZ = e.delta.length / 10
                        let valX = Math.abs(tiltX / 90)
                        let valY = Math.abs(tiltY / 90)
                        
                        if(e.event.pointerType == "mouse"){
                            this.path.addGradientPoint(softRoundPointY(e.point,DS.yPixelScale), project.currentStyle.strokeColor)
                        }
                        else {
                            this.path.addGradientPoint(softRoundPointY(e.point,DS.yPixelScale), new Color(valY,valX,1-valY,valZ))
                        }
                        
                    }
                }
            },
            pointerup(e) {
                if(e.event.pointerType == "touch"){
                    project.selectedItems.forEach(item => {
                        //item.resetPivot()
                        item.data.rotation = item.rotation
                        item.data.scaling = item.scaling
                        item.data.pointerId = null
                    })                    
                }
                else {
                    if(this.path && !e.event.metaKey){
                        this.path.simplify()
                        this.path.simplifyGradient()
                    }
                }
                updateUndo()
            }
        },
        description: "Draw freehand"
    },
    drawline: {
        eventTypes: ['keydown','pointerdown','pointermove','pointerup'],
        eventHandler: {
            keydown(e){
                if(e.event.key == "Escape"){
                    console.log('vittu')
                    project.deselectAll()
                    this.path.selected = false
                    this.path = null
                }
            },
            pointerdown(e) {
                this.downPoint = e.point
                if(this.path){
                    this.path.add(e.point)
                }
                else {
                    this.path = createNotePath(e, true)
                    this.path.add(e.point)
                }
                //this.path.add(e.point)
                //this.path.strokeColor = "red"
                //this.path.strokeWidth = 4
            },
            pointermove(e) {
                if(this.path){
                    this.path.lastSegment.point = e.point
                }
            },
            pointerup(e) {
                this.path.matchGradientToSegments()
                let delta = e.point.subtract(this.downPoint)
                if(delta.length > 1){
                    this.path.selected = false
                    this.path = null
                }    
            }
        },
        description: "Draw line"
    },
    spray: {
        eventHandler: {
            pointerdown(e) {
                if(e.hit && e.hit.item && e.hit.type == "segment"){
                    e.hit.item.setGradientColorAtSegment(e.hit.segment.index, project.currentStyle.strokeColor)
                }
            },
            pointermove(e) {
                if(e.event.buttons){
                    if(e.hit && e.hit.item && e.hit.type == "segment"){
                        e.hit.item.setGradientColorAtSegment(e.hit.segment.index, project.currentStyle.strokeColor)
                    }
                }
            },
            pointerup(e) {

            }
        },
        description: "Spray (recolor)"
    },
    eraser: {
        eventHandler: {
            pointerdown(e) {
                console.log('its me eraseeerrr')
            },
            pointermove(e) {

            },
            pointerup(e) {

            }
        },
        description: "Erase"
    }
}

const modifierTools = {
    smudge: {
        eventHandler: {
            pointerdown(e) {
                console.log(e)
                console.log('its meee SMUDGEE')
            },
            pointermove(e) {

            },
            pointerup(e) {
                
            }
        },
        description: "Smudge tool"
    },
}

var tools = [
    {
        id: "tools",
        type: "radio",
        definitions: drawingTools
    },
//    { id: "tools", type: "radio", definitions: modifierTools},
]

function setActiveTool(toolStack, id){
    toolStack.tools.forEach(tool => {
        if(tool.id != id)
            tool.deactivate()
        else tool.activate()
    })
    toolStack.previousTool = toolStack.currentTool != null && toolStack.currentTool != "selection" 
    ? toolStack.currentTool
    : id;
    toolStack.currentTool = id
}

/*
define CustomEvents for 
noteon() noteoff() cc() pitchbend()
OR just midi()
*/

export { tools, setActiveTool }