import DimTool from './DimTool.js';
import { tools } from './tools.js';
import { commands } from './commands.js';

const elementById = new Proxy(
    {},
    { get: (target, id) => document.getElementById(id) }
)
const elementsByClass = new Proxy(
    {},
    { get: (target, className) => document.querySelectorAll('.' + className) }
)
const elementsByTagName = new Proxy(
    {},
    { get: (target, tagName) => document.getElementsByTagName(tagName) }
)

const createToolButtonElement = (params) => {
    let { type, name, id, style, title } = params
    let className = `dim-button ds-icon ds-${id}`
    let element;
    let inputElement = Object.assign(document.createElement(type !== "button" ? 'input' : 'button'), {...params, className})
    if (type == "button") {
        element = inputElement;
    }
    else {
        let label = document.createElement('label')
        label.appendChild(inputElement)
        element = label
    }
    return element
}

const createElement = (params) => Object.assign(document.createElement(params.tag), params)

function undoListener(){
    //console.log('undoo')
}

function createTools() {
    let guiGroups = [...tools, ...commands]
    let defaultTool = 'pencil'
    let toolStack = {
        tools:[],
        currentTool:null,
        previousTool:null
    }

    guiGroups.forEach(toolgroup => {
        let toolGroupContainer = createElement({
            id: toolgroup.id,
            tag: 'div',
            className: "toolgroup"
        })

        gui.appendChild(toolGroupContainer)

        Object.entries(toolgroup.definitions).forEach(
            ([id, value]) => {
                document.styleSheets[0].insertRule(`.ds-${id}:before { background-image: var(--icon-${id}); }`);
                let toolElement = createToolButtonElement({
                    type: toolgroup.type,
                    name: toolgroup.id,
                    id,
                    title: value.description,
                    checked: id == defaultTool ? true : false,
                    style: `--icon-${id}: url('../assets/dimsyn_icons_all.svg#${id}');`
                })
                toolGroupContainer.appendChild(toolElement)

                if (value.eventHandler) {
                    if (toolgroup.id.includes("commands")){
                        Object.keys(value.eventHandler).forEach(key => {
                            toolElement.addEventListener(key, value.eventHandler[key])
                        })
                        toolElement.addEventListener('pointerup', undoListener)
                    }
                    else {
                        let tool = new DimTool({ ...value, id, targetElement: canvas, toolElement })
                        toolStack.tools.push(tool)
                    }
                }
            }
        )

        if (toolgroup.id == "tools") {
            toolGroupContainer.addEventListener("input", function (e) {
                let toolId = e.target.id
                toolStack.tools.forEach(tool => {
                    if (toolId == tool.id) {
                        tool.activate()
                    }
                    else tool.deactivate()
                })
                toolStack.previousTool = toolStack.currentTool != null && toolStack.currentTool != "selection" 
                ? toolStack.currentTool 
                : toolId;
                toolStack.currentTool = toolId

                console.log(toolStack.previousTool)
                console.log(toolStack.currentTool)
            })
        }
    })
    //activate the default tool
    //toolArray.filter(tool => tool.id == defaultTool)[0].activate()

    return toolStack
}


export {
    elementById,
    elementsByClass,
    elementsByTagName,
    createToolButtonElement,
    createElement,
    createTools,
}
