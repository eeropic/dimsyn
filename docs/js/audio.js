audioCtx = null
oscArray = []
globalTimer = null
globalTime = 0
activeIDs = []

function noteToFrequency(noteNumber) {
  return 440 * Math.pow(2, (noteNumber-69) / 12);
}

function initAudioContext(){
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioCtx = new AudioContext({sampleRate: 48000});

  audioCtx.audioWorklet.addModule('js/oscillator-processor.js').then(() => {
    for(let i = 0; i < 4; i++){
        let osc = new AudioWorkletNode(audioCtx, 'oscillator-processor', {outputChannelCount: [2]});
        osc.connect(audioCtx.destination)
        oscArray.push({id:null, osc, lastUpdate: 0})
    }
  });

  let prevStamp = 0
  let currStamp = 0
  let prevData = 0
  let currData = 0

  audioCtx.audioWorklet.addModule('js/timer-processor.js').then(() => {
      globalTimer = new AudioWorkletNode(audioCtx, 'timer-processor');
      globalTimer.port.onmessage = function(e){
        view.update()
        //console.log(e.data.timestamp - parseFloat(e.data))
        /*
        prevStamp = currStamp
        prevData = currData
        currStamp = e.timeStamp / 1000
        currData = e.data
        console.log('stamp ' + (currStamp - prevStamp))
        console.log('data  ' + (currData - prevData))
        */
        globalTime = e.data

        if(project.selectedItems.length == 0){
          if(drawTool.touches.length >= 2){
              drawTool.touchesCenter = drawTool.touches.reduce( 
                  (prev,curr) => {
                      return {
                          point: prev.point.add(curr.point)
                      }
                  },
                  {
                      point: new Point(0,0)
                  }
              ).point.divide(drawTool.touches.length)
              drawTool.touchPath.segments = drawTool.touches.map(x => x.point.subtract(drawTool.touchesCenter))
          }
          else {
              drawTool.touchPath.segments = [new Point(0,0), new Point(0,view.viewSize.height)]
              drawTool.touchesCenter = [0,0]
          }
  
          if(drawTool.playing){
              drawTool.prevPosition = drawTool.playPosition
              drawTool.playPosition+=5;
          }
          
          drawTool.touchPath.position.x = drawTool.playPosition % 1280
          drawTool.touchPath.position.y = view.center.y
  
          if(drawTool.touches.length>=2){
              drawTool.prevPosition = drawTool.playPosition
              drawTool.playPosition = drawTool.touchesCenter.x
              drawTool.touchPath.position = drawTool.touchesCenter
          }
        }        
  
        let items = project.getItems({guide: false,className: "Path",})
  
        items.forEach(item => {
            let intersects = item.intersects(drawTool.touchPath)

            if(intersects){
                if(activeIDs.indexOf(item.id) == -1)
                    activeIDs.push(item.id)
                
                // find next available oscillator or the use existing with same id
                let oscObject = oscArray.filter(oscillator => oscillator.id == null)
                let existingOscy = oscArray.filter(oscillator => oscillator.id == item.id)

                if(oscObject.length && !existingOscy.length){
                    oscObject[0].id = item.id
                    if(drawTool.playPosition != drawTool.prevPosition){
                        //if(audioCtx.currentTime - oscObject[0].lastUpdate > 0.05){
                            intersectItem(drawTool.touchPath, item, activeIDs.length, 1, oscObject[0], 0.004)
                            //oscObject[0].lastUpdate = Math.max(oscObject[0].lastUpdate+0.04, audioCtx.currentTime+0.04)
                        //}
                    }
                    oscObject[0].osc.port.postMessage("reset")
                }
                else if(existingOscy.length){
                    if(drawTool.playPosition != drawTool.prevPosition){
                        //if(audioCtx.currentTime - existingOscy[0].lastUpdate > 0.05){
                            intersectItem(drawTool.touchPath, item, activeIDs.length, 1, existingOscy[0], 0.004) 
                            //existingOscy[0].lastUpdate = Math.max(existingOscy[0].lastUpdate+0.04, audioCtx.currentTime+0.04)
                        //}
                    }                 
                }

            }
            else {
                activeIDs = activeIDs.filter(id => id != item.id)
                let _osc = oscArray.filter(oscillator => oscillator.id == item.id)
                if(_osc.length){
                    _osc[0].id = null
                    let amp = _osc[0].osc.parameters.get("amp")
                    //if(amp.value > 0){
                        //if(audioCtx.currentTime - _osc[0].lastUpdate >= 0.05){
                            //amp.setValueCurveAtTime([amp.value, 0], Math.max(_osc[0].lastUpdate, audioCtx.currentTime), 0.04)
                            console.log('kek')
                            amp.cancelScheduledValues(audioCtx.currentTime)
                            amp.setTargetAtTime(0,audioCtx.currentTime, 0.001)
                            //_osc[0].lastUpdate = Math.max(_osc[0].lastUpdate+0.04, audioCtx.currentTime+0.04)
                        //}
                    //}
                    
                }
            }
        })

        let symbolItems = project.getItems({guide: false, className: "SymbolItem"})
        symbolItems.forEach(item => {
            let intersects = drawTool.touchPath.intersects(item)
            if(intersects){
                intersectionCount++
                let childItems = item.definition.item.getItems({className: "Path"})
                if(item.definition.item.data.players.indexOf(item.id) == -1)
                    item.definition.item.data.players.push(item.id)

                childItems.forEach(childItem => {
                    intersectSymbolItem(drawTool.touchPath, childItem, intersectionCount, 1, item) 
                })
                //intersectItem(drawTool.touchPaths[0], item, intersectionCount, (drawTool.touches[0].pressure + drawTool.touches[1].pressure) / 1000)
            }
            else {
                item.definition.item.data.players = item.definition.item.data.players.filter(id => id != item.id)
                if(item.definition.item.data.players.length == 0){
                    let childItems = item.definition.item.getItems({className: "Path"})
                    childItems.forEach(childItem => {
                        let amp = childItem.data.osc.parameters.get("amp")
                        amp.linearRampToValueAtTime(0,audioCtx.currentTime+0.02)
                    })
                }
            }
        })
  
  


      }
  });  
  audioCtx.resume()
}

function getOscillatorParamRefs(osc){
  return {
    amp:osc.parameters.get('amp'), 
    frequency: osc.parameters.get('frequency'),
    midpoint: osc.parameters.get('midpoint'), 
    curvature: osc.parameters.get('curvature'), 
    pan: osc.parameters.get('pan'),
    noise: osc.parameters.get('noise'),
    //resonance: osc.parameters.get('resonance'),
  }  
}

function setOscillatorParams(params){
  const {osc, amp, pan, frequency, midpoint, curvature, noise, rampDuration,
  //  resonance, 
  context} = params;
  const {amp: _amp, pan: _pan, frequency: _frequency, midpoint: _midpoint, curvature: _curvature, noise: _noise, 
  // resonance: _resonance
  } = getOscillatorParamRefs(osc.osc);
  //let rampDuration = 1/60;
  //_amp.cancelAndHoldAtTime(context.currentTime)
  //console.log(_amp.value)
  //console.log(amp)
  //setValueCurveAtTime(values, startTime, duration)

    //_amp.setValueCurveAtTime([_amp.value, amp], Math.max(osc.lastUpdate, context.currentTime), rampDuration)
  _amp.setTargetAtTime(amp,context.currentTime, rampDuration)
  //_amp.linearRampToValueAtTime(amp, Math.max(osc.lastUpdate,context.currentTime) + rampDuration)
  _frequency.linearRampToValueAtTime(frequency, context.currentTime + rampDuration)
  _midpoint.linearRampToValueAtTime(midpoint, context.currentTime + rampDuration)
  _curvature.linearRampToValueAtTime(curvature, context.currentTime + rampDuration)
  _pan.linearRampToValueAtTime(pan, context.currentTime + rampDuration)
  _noise.linearRampToValueAtTime(noise, context.currentTime + rampDuration)
  //_resonance.linearRampToValueAtTime(resonance, context.currentTime + rampDuration)    
}




