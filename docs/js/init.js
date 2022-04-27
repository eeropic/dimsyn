yPixelScale = 20
noteOffset = 36
pianoKeys = [1,0,1,0,1,1,0,1,0,1,0,1]

let noteLineCount = Math.floor(view.viewSize.height / yPixelScale)

let noteLines = []

for(let i = 0; i < noteLineCount; i++){
    if(pianoKeys[i%12]){
        let yCoord = view.viewSize.height - i*yPixelScale - yPixelScale/2
        let noteLinePath = new Path({
            guide: true,
            strokeWidth: yPixelScale-1,
            strokeColor: '#181818',
            segments:[[0,yCoord],[view.viewSize.width, yCoord]],
        })
        noteLines.push(noteLinePath)
    }
}
drawTool.noteLines = new Group(noteLines)

drawTool.touchPath = createTouchPath(0)
/*
//onscreen piano
let numKeys = 24
let keyWidth = view.viewSize.width / numKeys;
let keyHeight = view.viewSize.height * 0.2;
for(let i = 0; i < numKeys; i++){
    let keyPath = new Shape.Rectangle({
        fillColor: "white",
        strokeColor: "black",
        strokeWidth: 4,
        size: [keyWidth, keyHeight],
        opacity: pianoKeys[i%12] * 0.1 + 0.05,
        position: [i*keyWidth+keyWidth/2, view.bounds.bottom-keyHeight/2]
    })
}
*/

let dropArea = document.getElementById("drop-area")
dropArea.addEventListener('drop', handleDrop, false)
function handleDrop(e) {
    e.preventDefault();
    let file = [...e.dataTransfer.files][0]
    var reader = new FileReader();
    reader.onload = function(event) {
        importSVG(event.target.result)
    };
    reader.readAsText(file);
}
dropArea.addEventListener('dragover', handleOver, false)
function handleOver(e) {
    e.preventDefault();
}

function addEl(keys){
  keys.forEach(function(key){
    window.addEventListener(key, e => {
      e.preventDefault();
      //console.log(key)
      //console.log(e)
    })
  })  
}

function dlog(msg){
    //socket.emit('log', msg);
}

window.addEventListener("beforeunload", function(event) {
    //window.localStorage.setItem('dimsyn', JSON.stringify(exportProject()));
});
/*
canvas.addEventListener('wheel', function(event) {
    event.preventDefault();
    event.stopPropagation();
    var e = event.originalEvent,
        view = scope.view,
        offset = canvas.offset(),
        point = view.viewToProject(
            paper.DomEvent.getPoint(e).subtract(offset.left, offset.top)
        ), 
        delta = e.deltaY || 0,
        scale = 1 - delta / 100;
    view.scale(scale, point);
    console.log('wheeellll')
    return false;
});
*/

const getElementOffset = elem => {
    let rect = elem.getBoundingClientRect();
    var offset = { 
        top: rect.top + window.scrollY, 
        left: rect.left + window.scrollX, 
    };
    return offset
}


window.addEventListener('wheel', event => {
    event.preventDefault();
    event.stopPropagation();
    if(!event.shiftKey && !event.ctrlKey){
        drawTool.prevPosition = drawTool.playPosition
        drawTool.playPosition = (drawTool.playPosition + event.deltaX / 2).mod(1280)
    }
	else if(event.shiftKey && !event.ctrlKey) {
        view.translate(-event.deltaX, -event.deltaY)
    }
    else if (!event.shiftKey && event.ctrlKey){
        let offset = getElementOffset(canvas),
        point = view.viewToProject(
            new Point(event.offsetX, event.offsetY).subtract(offset.left, offset.top)
        ),
        delta = event.deltaY || 0,
        scale = 1 - delta / 100;
        view.scale(scale, point);
	}
}, {passive: false})



//addEl(['scroll'])
let touchIDs = {}

document.getElementById("start-button").onclick = e => {
    console.log('init audio context')
    initAudioContext()
    document.getElementById("start-button").style.display = "none"
}

//document.getElementById("start-button").style.display = "none"
//initAudioContext()

document.getElementById("load-button").onclick = e => {
    importProject()
}

document.addEventListener('paste', function(e) {
    e.preventDefault()
    importSVGCB(e.clipboardData.getData('text/plain'))

})

document.addEventListener('copy', function(e) {
    e.preventDefault()
    console.log(project.exportSVG({asString: true}))
})

function createButtonAction(container, id, callback){
    let button = document.createElement("div")
    button.classList.add("button")
    button.id = id
    button.innerHTML = id
    container.appendChild(button)
    button.onclick = callback
}



createButtonAction(document.getElementById("gui"), "kekes", function(){
    let fileList = document.getElementById("filelist")
    while(fileList.firstChild){
        fileList.removeChild(fileList.firstChild)
    }
    fileList.classList.toggle("hidden")

    let dimsynFile = JSON.parse(window.localStorage.getItem('dimsyn'))
    let cnv = document.getElementById("hidden-canvas")
    for(let i = 0; i < dimsynFile.projects.length; i++){
        let proj = dimsynFile.projects[i]
        let dummyProject = new Project(cnv)
        let kek = dummyProject.importJSON(proj)
        let svgElem = dummyProject.exportSVG()
        svgElem.id = i
        svgElem.onclick = function(){
            paper.projects[0].importJSON(JSON.parse(window.localStorage.getItem('dimsyn')).projects[parseInt(this.id)])
            fileList.classList.toggle("hidden")
        }
        fileList.appendChild(svgElem)
    }
    paper.projects[0].activate()
})

document.getElementById("save-button").onclick = e => {
    let localProject = window.localStorage.getItem('dimsyn')
    let projectsObject = JSON.parse(localProject)
    console.log(projectsObject)
    projectsObject.projects.push(exportProject())
    window.localStorage.setItem('dimsyn', JSON.stringify(projectsObject));
}

document.getElementById("clone-button").onpointerdown = function(e){
    console.log(e)
    //this.classList.toggle("active")
    drawTool.cloneActive = true
}
document.getElementById("clone-button").onpointerup = function(e){
    console.log(e)
    //this.classList.toggle("active")
    drawTool.cloneActive = false
}

document.getElementById("remove-segment-button").onpointerdown = e => drawTool.removeSegment = true
document.getElementById("remove-segment-button").onpointerup = e => drawTool.removeSegment = false


var pointerTouches = []
var trackpadTouches = []

function resetItemPointerIds(){
    project.selectedItems.forEach(item => item.data.pointerIds = [])
}

function setItemPointerIds(e){
    drawTool.touches = drawTool.touches.filter(x => x.pointerId != e.pointerId)
    project.selectedItems.forEach(item => {
        if(item.data.pointerIds.length == 0){
        }
        else if(item.data.pointerIds.length == 1){
        }
        else if(item.data.pointerIds.length == 2){
            let otherTouch = drawTool.touches.filter(x => x.pointerId == item.data.pointerIds[1])[0];
            if(otherTouch){
                item.setDragPivot(otherTouch.point)  
            }             
        }
        item.data.pointerIds = item.data.pointerIds.filter(id => id != e.pointerId)
    })
}


canvas.addEventListener('contextmenu', e => {
    e.preventDefault()
})

canvas.addEventListener('touchstart', e => {
    e.preventDefault()
})

canvas.addEventListener('pointerdown', e => {
    e.preventDefault()
    let pt = new Point(e.layerX, e.layerY)
    //dlog(e.pointerId)
    if(e.pointerType == "touch"){
        drawTool.touches.push({
            pointerId: e.pointerId, 
            point: new Point(e.layerX, e.layerY),
            downPoint: new Point(e.layerX, e.layerY),
            width: e.width,
            height: e.height
        })
        drawTool.touches.sort((a, b) => a.pointerId > b.pointerId ? 1 : -1)
        drawTool.hit = project.hitTest(pt, {stroke: true, class:Path, segments: true})

        if(!drawTool.removeSegment){
            if(drawTool.hit && drawTool.hit.item){
                if(drawTool.touches.length<2){
                let item = drawTool.hit.item
                    if(!item.selected){
                        //item.data.pointerIds = [e.pointerId]
                        item.fullySelected = true
                    }
                    else {
                        //item.data.pointerIds.push(e.pointerId)
                    }
                }
                if(drawTool.cloneActive){
                    console.log('joo')
                    project.selectedItems.forEach(selectedItem => {
                        let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
                        osc.connect(audioCtx.destination);
                        let clone = selectedItem.clone()
                        selectedItem.selected = false
                        clone.data.osc = osc
                    })
                }
                if(drawTool.touches.length == 1){
                    project.selectedItems.forEach(item => {
                        if(item.fullySelected)
                            item.setDragPivot(new Point(e.layerX, e.layerY))
                        item.data.segmentOffsets = item.segments.filter(seg => seg.selected).map(seg => {
                            return pt.subtract(seg.point)
                        })
                    })
                }
            }
            else {
                //if(project.selectedItems.length == 0)
                    project.deselectAll()
                //resetItemPointerIds()
                if(!drawTool.tempPath)
                    drawTool.tempPath = new Path({guide:true,strokeColor: "cyan",strokeWidth: 2})
            }
        }
        else {

        }

    }
})

canvas.addEventListener('pointermove', e => {
    if(e.pointerType == "touch"){
        let currentTouch = drawTool.touches.filter(x => x.pointerId == e.pointerId)[0]
        currentTouch.point.x = e.layerX
        currentTouch.point.y = e.layerY
        currentTouch.width = e.width
        currentTouch.height = e.height
        
        if(!drawTool.removeSegment){
            if(drawTool.hit && drawTool.hit.item){
                if(drawTool.touches.length == 1){
                    if(project.selectedItems.length){        
                        project.selectedItems.forEach(item => {
                            //console.log(item)
                            //item.position = roundPointY(new Point(e.layerX, e.layerY), yPixelScale)
                            if(item.fullySelected){
                                item.position = new Point(e.layerX, e.layerY)
                                item.matchGradientToBounds()
                            }
                            else {
                                item.segments.filter(seg => seg.selected).forEach((seg,idx) => {
                                    console.log(item.data.segmentOffsets[idx].point)
                                    seg.point = currentTouch.point.subtract(item.data.segmentOffsets[idx])
                                })
                            }
                        })
                    }
                }
                else if(drawTool.touches.length == 2){
                    project.selectedItems.forEach(item => {
                        let scaleX = drawTool.touchRect.x / drawTool.touchRectStart.x
                        let scaleY = drawTool.touchRect.y / drawTool.touchRectStart.y
                        if(scaleX > scaleY){

                        }
                        else if(scaleY > scaleX){

                        }
                        else {

                        }
                        item.position = drawTool.touches[0].point
                        item.setDragPivot(drawTool.touches[0].point)
                        item.matchGradientToBounds()
                    })
                    if(drawTool.tempPath){
                        drawTool.tempPath.remove()
                        drawTool.tempPath = null 
                    }           
                }
            }
            else {
                if(drawTool.tempPath && drawTool.touches.length == 1){
                    drawTool.tempPath.add([e.layerX,e.layerY])
                }
            }
        }
        else {
            let hit = project.hitTest(currentTouch.point, {segments: true})
            if(hit && hit.type == "segment")
                hit.segment.remove()
            
        }
    }
})

canvas.addEventListener('pointerup', e => {
    if(e.pointerType == "touch"){
        //setItemPointerIds(e)
        if(drawTool.tempPath){
            drawTool.tempPath.closed = true
            let items = project.getItems({guide: false,className: "Path"})
            items.forEach(item => {
                if(item.isInside(drawTool.tempPath.bounds)){
                    item.fullySelected=true
                }
                item.segments.forEach(seg => {
                    let segPoint = item.localToGlobal(seg.point)
                    if(drawTool.tempPath.contains(segPoint)){
                        seg.selected = true
                    }
                })
                item.data.segments = item.segments.filter(seg => seg.selected)
            })
            drawTool.tempPath.remove()
            drawTool.tempPath = null
        }
        drawTool.touches = drawTool.touches.filter(x => x.pointerId != e.pointerId)
        if(drawTool.touches.length == 1){
            project.selectedItems.forEach(item => item.setDragPivot(drawTool.touches[0].point))
        }
        if(project.selectedItems.length>0){
            console.log('yes')
            project.selectedItems.forEach(item=>{
                item.segments.forEach(seg => {
                    let pt = softRoundPointY(item.localToGlobal(seg.point), yPixelScale)
                    seg.point = item.globalToLocal(pt)
                })
            })
        }
    }
})

canvas.addEventListener('pointercancel', e => {
    if(e.pointerType == "touch"){
        //setItemPointerIds(e)
        drawTool.touches = drawTool.touches.filter(x => x.pointerId != e.pointerId)
        if(drawTool.touches.length == 1){
            project.selectedItems.forEach(item => item.setDragPivot(drawTool.touches[0].point))
        }        
        drawTool.tempPath.remove()
        drawTool.tempPath = null
    }
})

canvas.addEventListener('gesturestart', e => {
    e.preventDefault();
    drawTool.touchScale = e.scale
    drawTool.touchRotation = e.rotation
    drawTool.touchPosition = new Point(e.layerX, e.layerY)
    drawTool.touchDelta = new Point(0, 0)
    let rect = drawTool.touchPosition.subtract(drawTool.touches[0].point)
    drawTool.touchRectStart = new Point(Math.abs(rect.x),Math.abs(rect.y))
    if(drawTool.touches.length == 1){
        project.selectedItems.forEach(item=>{
            item.setDragPivot(drawTool.touches[0].point)
            item.data.scaling = item.scaling
            item.data.rotation = item.rotation
            item.data.startA = item.matrix.a
            item.data.startD = item.matrix.d
        })
    }
})

canvas.addEventListener('gesturechange', e => {
    e.preventDefault();
    drawTool.touchPosition.x = e.layerX
    drawTool.touchPosition.y = e.layerY
    let rect = drawTool.touchPosition.subtract(drawTool.touches[0].point)
    drawTool.touchRect = new Point(rect.x, rect.y)
    let scaleX = drawTool.touchRect.x / drawTool.touchRectStart.x
    let scaleY = drawTool.touchRect.y / drawTool.touchRectStart.y
    drawTool.touchScale = e.scale
    drawTool.touchRotation = e.rotation

    if(drawTool.touches.length == 2){
        project.selectedItems.forEach(item=>{
            item.data.lastScaling = item.scaling
            item.data.lastRotation = item.rotation
            //item.scaling = item.data.scaling.multiply(e.scale)
            //item.scale(drawTool.touchRect.x / 100, drawTool.touchRect.y / 100)
            //item.matrix.a = scaleX * item.data.startA
            //item.matrix.d = scaleY * item.data.startD
            item.rotation = item.data.rotation + e.rotation
        })
    }
    // ugly hack, we get the touch count only after 1st gesture event fired
    if(drawTool.touches.length == 3){
        project.selectedItems.forEach(item=>{
            console.log('persetti')
            //item.scaling = item.data.lastScaling
            item.rotation = item.data.lastRotation
        })
    }
})

canvas.addEventListener('gestureend', e => {
    e.preventDefault();    
    console.log('endu')
    drawTool.touchScale = null
    drawTool.touchRotation = null 
    drawTool.touchPosition = null 
    drawTool.touchDelta = null  
})


var ws = new WebSocket("wss://" + location.host);

ws.onopen = function() {
  console.log('opened')
  //ws.send("Message to send");
};

let prevTime = 0 
let currTime = 0

let globalStart = 0;

let started = false


let touchStateColors = [
    "white",    // MTTouchStateNotTracking = 0,
    "red",      // MTTouchStateStartInRange = 1,
    "orange",   // MTTouchStateHoverInRange = 2,
    "yellow",   // MTTouchStateMakeTouch = 3,
    "green",    // MTTouchStateTouching = 4,
    "cyan",     // MTTouchStateBreakTouch = 5,
    "magenta",  // MTTouchStateLingerInRange = 6,
    "blue"      // MTTouchStateOutOfRange = 7
]


ws.onmessage = function (evt) { 
    let dat = JSON.parse(evt.data)

    if(dat[0] === "midi"){
        let items = project.getItems({
            guide: false,
            className: "Path",
        }) 
        let osc = items[0].data.osc
        let amp = osc.parameters.get('amp')
        let frequency = osc.parameters.get('frequency')
        
        if(dat[1] == 144){
            //amp.linearRampToValueAtTime(dat[3]/128,audioCtx.currentTime+0.01)
            //frequency.setValueAtTime(noteToFrequency(dat[2]),audioCtx.currentTime)
        }
        if(dat[1] == 128){
            //amp.linearRampToValueAtTime(0,audioCtx.currentTime+0.01)
        }
        //console.log(dat)
    }
    else {
        [sequenceId, posX, posY, velX, velY, angle, majorAxis, minorAxis, frame, state, size, pressure] = dat
        //let currTouch = touches[sequenceId]
        //currTouch.fillColor = touchStateColors[state]
        //currTouch.position = [posX * view.viewSize.width, view.viewSize.height - posY * view.viewSize.height]
        //currTouch.size = [majorAxis * 10 * size, minorAxis * 10 * size]
        //currTouch.rotation = -angle
        //console.log(trackpadTouches.length)     
        if(state == 1){
            let pt = new Point(posX * view.viewSize.width, view.viewSize.height - posY * view.viewSize.height)
            drawTool.touches.push({pointerId: sequenceId, point: pt, downPoint: pt, pressure: pressure})
        }
        else if(state == 0 || state == 7){
            drawTool.touches = drawTool.touches.filter(x => x.pointerId != sequenceId)
        }
        else {
            let currentTouch = drawTool.touches.filter(x => x.pointerId == sequenceId)[0]
            if(currentTouch){
                currentTouch.point.x = posX * view.viewSize.width,
                currentTouch.point.y = view.viewSize.height - posY * view.viewSize.height
                currentTouch.pressure = pressure
            }
            // pointerTouches.push({pointerId: e.pointerId, x: e.layerX, y: e.layerY})
        }
    }
};

/*
states
MTTouchStateNotTracking = 0,
MTTouchStateStartInRange = 1,
MTTouchStateHoverInRange = 2,
MTTouchStateMakeTouch = 3,
MTTouchStateTouching = 4,
MTTouchStateBreakTouch = 5,
MTTouchStateLingerInRange = 6,
MTTouchStateOutOfRange = 7
*/

ws.onclose = function() { 
  console.log('closed')
};

const circleColors = [
    "#FF0000",
    "#FF9900",
    "#FFFF00",
    "#00FF00",
    "#0066FF",
    "#00FFFF",
    "#0000FF",
    "#666666",
    "#BBBBBB",
    "#FFFFFF"
]

drawTool.debugCircles = []

for(let i=0;i<10;i++){
    drawTool.debugCircles.push(
        new Shape.Circle({
            radius: 40,
            fillColor: circleColors[i],
            position: [0,0],
            opacity: 0,
            guide: true,
            data: {
                pointerId: null
            }
        })
    )
}

drawTool.drawTouches = function(){
    this.touches.forEach( (touch, idx) => {
        if(this.debugCircles[idx].data.pointerId==null)
            this.debugCircles[idx].data.pointerId = touch.pointerId
        if(this.debugCircles[idx].data.pointerId==touch.pointerId){
            this.debugCircles[idx].position = touch.point
            this.debugCircles[idx].opacity = 1
        }
    })
}



view.autoUpdate = false
view.onFrame = function(e){
    if(e.count % 10 == 0){
        //console.log(activeIDs)
        //console.log(oscArray)
    }

}

