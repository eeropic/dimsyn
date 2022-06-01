import { getCanvasItems } from './paperUtils.js'
import { clamp } from './mathUtils.js'
import { getItemsByName } from './paperUtils.js'
import { DS } from './init.js'

const transportCommands = {
    play: {
        eventHandler:{
            change(){
                console.log('change')
                ds.playing = !ds.playing
                let playheads = getItemsByName(project, "Path", "playhead", false)
                playheads.forEach(item => {
                    console.log(item)
                    if(ds.playing)
                        item.opacity = 1
                    else item.opacity = 0.5
                })
            }
        },
        description: "Start/Stop playback"
    }
}

const projectCommands = {
    undo: {
        eventHandler:{
            pointerdown(){
                if(ds.undoPosition > 0 && ds.undoPosition <= ds.undoBuffer.length){
                    ds.undoPosition = clamp(ds.undoPosition - 1, 0, ds.undoBuffer.length)
                    console.log(ds.undoPosition, ds.undoBuffer.length)
                    project.clear()
                    project.importJSON(ds.undoBuffer[ds.undoPosition])                    
                }
            }
        },
        description: "Undo"
    },
    redo: {
        eventHandler:{        
            pointerdown(){
                if(ds.undoPosition >= 0 && ds.undoPosition < ds.undoBuffer.length - 1){
                    ds.undoPosition = clamp(ds.undoPosition + 1, 0, ds.undoBuffer.length)  
                    project.clear()
                    project.importJSON(ds.undoBuffer[ds.undoPosition])                    
                }
            },
        },
        description: "Redo"
    },
    clear: {
        eventHandler:{         
            pointerdown(){
                if(project.selectedItems.length){
                    project.selectedItems.forEach(item => item.remove())
                }
                else {
                    let items = getCanvasItems()
                    items.forEach(item => item.remove())
                }
            },
        },
        description: "Clear canvas"
    },
}

const colorCommands = {
    sine: {
        eventHandler:{
            pointerdown(){
                console.log('sine')
                project.currentStyle.strokeColor = DS.oscColors.sine
            }
        },
        description: "Sine"
    },    
    triangle: {
        eventHandler:{
            pointerdown(){
                console.log('square')
                project.currentStyle.strokeColor = DS.oscColors.triangle
            }
        },
        description: "Triangle"
    },
    square: {
        eventHandler:{
            pointerdown(){
                console.log('square')
                project.currentStyle.strokeColor = DS.oscColors.square
            }
        },
        description: "Square"
    },
    pwm: {
        eventHandler:{
            pointerdown(){
                project.currentStyle.strokeColor = DS.oscColors.pwm
            }
        },
        description: "PWM"
    },   
    sawtooth: {
        eventHandler:{
            pointerdown(){
                console.log('sawtooth')
                project.currentStyle.strokeColor = DS.oscColors.sawtooth
            }
        },
        description: "Sawtooth"
    }, 
    noise: {
        eventHandler:{
            pointerdown(){
                console.log('noise')
                project.currentStyle.strokeColor = DS.oscColors.noise
            }
        },
        description: "Noise"
    },     
}

const fileCommands = {
    download_svg: {
        eventHandler:{
            pointerdown(){
                console.log(project.exportSVG())
            }
        },
        description: "Download project as .SVG"
    },
}

var commands = [
//  {   id: "filecommands", type: "button", definitions: fileCommands},
    {
        id: "colorcommands",
        type: "radio",
        definitions: colorCommands
    },
    {
        id: "transportcommands",
        type: "checkbox",
        definitions: transportCommands
    },
    {
        id: "projectcommands",
        type: "button",
        definitions: projectCommands
    },
]

export { commands }