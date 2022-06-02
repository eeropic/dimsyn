import { DS } from './init.js';
import { clamp } from './mathUtils.js';

function createNoteGrid(){
    for(let i = 0; i < 128; i++){
        if(DS.pianoKeys[i%12]){
            let yCoord = i * DS.pxPerSemitone
            let noteLinePath = new Path({
                guide: true,
                strokeWidth: DS.pxPerSemitone-1,
                strokeColor: '#191919',
                segments:[[0,yCoord],[1280, yCoord]],
            })
        }
    }
}

function initGUI() {
    createNoteGrid()

    /*
    window.addEventListener('wheel', event => {

    }, { passive: false })
*/
}

export {initGUI}