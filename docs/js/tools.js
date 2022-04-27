


let drawTool = new Tool();
drawTool.path = 0
paper.settings.hitTolerance = 16;

drawTool.webkitForce= null

window.addEventListener('webkitmouseforcechanged', e => {
	e.preventDefault();
	drawTool.webkitForce = e.webkitForce;
})

drawTool.touches = []
drawTool.touchesCenter = new Point(0,0)
drawTool.touchScale = null
drawTool.touchRotation = null
drawTool.touchPosition = null
drawTool.touchDelta = null
drawTool.touchRect = null
drawTool.touchRectStart = null
drawTool.cloneActive = false
drawTool.removeSegment = false
drawTool.playing = false
drawTool.playPosition = 0

drawTool.on({
    mousedown(e){
        if(e.event.pointerType == "pen" || e.event.pointerType == "mouse"){
            let hit = project.hitTest(e.point, {guides:false})
            console.log(hit)
            if(!hit || !hit.item.selected){
                let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
                osc.connect(audioCtx.destination)
                this.path = new Path({
                    applyMatrix: false,
                    strokeWidth: yPixelScale/2,
                    strokeColor: {
                        gradient: {
                            stops:[[new Color(0,0,0,1),0],[new Color(0,0,0,1),0]]
                        }
                    },
                    strokeScaling: false,
                    segments: [softRoundPointY(e.point,yPixelScale)],
                    data: { 
                            osc, 
                            pointerIds: [],
                        }
                })
            }
            else {
                if(hit.item && hit.item.selected){
                    console.log('boloogo')
                    this.tempPath = new Path({
                        guide:true,
                        strokeColor: "cyan",
                        strokeWidth: 2
                    })
                }
            }
        }        
    },
    mousemove(e){
        if(e.event.pointerType == "pen" || e.event.pointerType == "mouse"){
            let tiltX = e.event.tiltX || 0
            let tiltY = e.event.tiltY || 0
            let valZ = e.event.pressure || drawTool.webkitForce % 1 || e.delta.length / 10;
            if(valZ == 0.5)
                valZ = e.delta.length / 10
            let valX = Math.abs(tiltX / 90)
            let valY = Math.abs(tiltY / 90)
            if(this.path)
                this.path.addGradientPoint(softRoundPointY(e.point,yPixelScale), new Color(valY,valX,1-valY,valZ))
            else if(this.tempPath){
                this.tempPath.add(e.point)
            }
        }
    },           
    mouseup(e){
        if(e.event.pointerType == "pen" || e.event.pointerType == "mouse"){
            if(this.path){
                if(this.path.length>0){
                    if(this.path.bounds.width>0)
                        this.path.matchGradientToBounds()
                    this.path.simplify()
                    //this.path.simplifyGradient()
                }
                this.path = 0
            }
            else if(this.tempPath){
                let selectedPath = project.selectedItems[0];
                this.tempPath.simplify()
                let startPoint = this.tempPath.firstSegment.point
                let endPoint = this.tempPath.lastSegment.point
                let cutStart = selectedPath.getNearestLocation(startPoint)
                let cutEnd = selectedPath.getNearestLocation(endPoint)

                let firstSegment = cutStart.curve.segment2
                let lastSegment = cutEnd.curve.segment1
                for(let i = firstSegment.index; i < lastSegment.index; i++){
                    let seg = selectedPath.segments[i]
                    let closest = this.tempPath.getNearestPoint(seg.point)
                    seg.point = closest
                }
                selectedPath.smooth()
                this.tempPath.remove()
            }
        }
    },
    keydown(e){
        if(e.key == "space"){
            this.playing = !this.playing
        }
        if(e.key == "enter"){
            this.playPosition = 0;
        }
    }
})