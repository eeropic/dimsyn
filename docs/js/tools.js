let drawTool = new Tool();
drawTool.path = 0
paper.settings.hitTolerance = 16;

drawTool.webkitForce= null

window.addEventListener('webkitmouseforcechanged', e => {
	e.preventDefault();
	drawTool.webkitForce = e.webkitForce;
})

Object.entries({
    touches: [],
    touchesCenter: new Point(0,0),
    touchScale: null,
    touchRotation: null,
    touchPosition: null,
    touchDelta: null,
    touchRect: null,
    touchRectStart: null,
    cloneActive: false,
    removeSegment: false,
    playing: false,
    prevPosition: 0,
    playPosition: 0
}).forEach(keyValue => drawTool[keyValue[0]] = keyValue[1])

drawToolFunctions = {
    down: {
        pen(e){
        },
        mouse(e){
        },
        touch(e){
        }
    },
    move: {
        pen(e){
        },
        mouse(e){
        },
        touch(e){
        }
    },
    up: {
        pen(e){
        },
        mouse(e){
        },
        touch(e){
        }
    }
}

drawTool.on({
    mousedown(e){
        // drawToolFunctions.down[e.event.pointerType].call(this, e)
        if(e.event.pointerType == "pen"){
            let hit = project.hitTest(e.point, {guides:false})
            if(!hit || !hit.item.selected){
                this.path = createNotePath(e)
            }
            else {
                if(hit.item && hit.item.selected){
                    this.tempPath = new Path({
                        guide:true,
                        strokeColor: "cyan",
                        strokeWidth: 2
                    })
                }
            }
        }
        else if(e.event.pointerType == "mouse"){
            this.path = createNotePath(e)
        }
        else if(e.event.pointerType == "touch"){
            console.log('yessss')
        }
    },
    mousemove(e){
        let tiltX = e.event.tiltX || 0
        let tiltY = e.event.tiltY || 0
        let valZ = e.event.pressure || drawTool.webkitForce % 1 || e.delta.length / 10;
        if(valZ == 0.5)valZ = e.delta.length / 10
        let valX = Math.abs(tiltX / 90)
        let valY = Math.abs(tiltY / 90)

        if(e.event.pointerType == "pen"){
            if(this.path && e.event.buttons){
                this.path.addGradientPoint(softRoundPointY(e.point,yPixelScale), new Color(valY,valX,1-valY,valZ))
            }
            else if(this.tempPath){
                this.tempPath.add(e.point)
            }
        }
        else if(e.event.pointerType == "mouse"){
            if(this.path && e.event.buttons){
                this.path.addGradientPoint(softRoundPointY(e.point,yPixelScale), new Color(valY,valX,1-valY,valZ))
            }
        }
        else if(e.event.pointerType == "touch"){
            
        }
    },
    mouseup(e){
        if(e.event.pointerType == "pen" || e.event.pointerType == "mouse"){
            if(this.path){
                if(this.path.length>0){
                    if(this.path.bounds.width>0)
                        this.path.matchGradientToBounds()
                    this.path.simplify()
                    this.path.simplifyGradient()
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
            this.prevPosition = this.playPosition;
            this.playPosition = 0;
        }
    }
})