export default class DimTool {
    touches = []
    downPoint = null
    lastPoint = null
    delta = null
    point = null
    numTouches = 0
    constructor(
        toolConfig = {
            id: 'myTool',
            targetElement: globalThis,
            eventHandler: {
                pointerdown(event) {},
                pointerdrag(event) {},
                pointerup(event) {}
            }
        }
    ) {
        Object.assign(this, toolConfig)
    }

    updatePointers(id) {
        this.touches = this.touches.filter(pointer => pointer.id != id)
    }

    hasActivePointer(id) {
        return this.touches.filter(pointer => pointer.id == id).length > 0
    }

    activate() {
        let eventTypes = Object.keys(this.eventHandler)
        eventTypes.forEach(eventType =>
            this.targetElement.addEventListener(eventType, this, { passive: false })
        )
        if(this.toolElement != null)
            this.toolElement.firstElementChild.checked = true
    }

    deactivate() {
        let eventTypes = Object.keys(this.eventHandler)
        eventTypes.forEach(eventType =>
            this.targetElement.removeEventListener(eventType, this)
        )
    }

    handleEvent(e) {
        this.lastPoint = this.point || new Point(e.clientX, e.clientY)
        this.point = new Point(e.clientX, e.clientY)
        this.delta = this.point.subtract(this.lastPoint)

        if (e.type == 'pointerdown' && !this.hasActivePointer(e.pointerId) && e.pointerType == "touch"){
            this.touches.push({ id: e.pointerId, point: this.point })
        }

        if (e.type == 'pointerdown' && e.pointerType != "touch")
            this.downPoint = this.point
        
        if (e.type == 'pointermove'){
            let currentPointer = this.touches.filter(touch => touch.id == e.pointerId)
            if(currentPointer.length){
                currentPointer[0].point = this.point
            }            
        }

        // call the pointer event handler // TODO: Handle this better
        if(this.eventHandler[e.type] != null){
            let hit = project.hitTest(view.viewToProject(this.point), {
                tolerance: 10 / view.zoom, 
                fill: false, 
                stroke: true, 
                segments: true, 
                guides: false
            })
            this.eventHandler[e.type].call(this, { 
                downPoint: view.viewToProject(this.downPoint), 
                lastPoint: view.viewToProject(this.lastPoint), 
                point: view.viewToProject(this.point), 
                delta: this.delta,
                hit, 
                event: e
            })
        }

        if (e.type == 'pointerup' || e.type == 'pointercancel')
            this.updatePointers(e.pointerId)

        if(e.pointerType == "touch"){
            console.log(this.touches)
        }
    }
}

