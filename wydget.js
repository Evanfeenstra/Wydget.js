//cross-browser touch stuff based on this article by Matt Gaunt: https://developers.google.com/web/fundamentals/input/touch/touchevents/

  var pointerDownName = 'MSPointerDown';
  var pointerUpName = 'MSPointerUp';
  var pointerMoveName = 'MSPointerMove';

  if(window.PointerEvent) {
    pointerDownName = 'pointerdown';
    pointerUpName = 'pointerup';
    pointerMoveName = 'pointermove';
  }

  // Simple way to check if some form of pointerevents is enabled or not
  window.PointerEventsSupport = false;
  if(window.PointerEvent || window.navigator.msPointerEnabled) {
    window.PointerEventsSupport = true;
  }
  
  // Shim for requestAnimationFrame from Paul Irishpaul ir
    // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/ 
  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
  })();

function Wydget(element, color, initial, direction, kind) {
  var isAnimating = false;
  if(kind!='pad') {
    var lastPos = initial;
    var initialPos = initial;
    var lastHolderPos = initial;
  }
  else{
    var lastPos={};lastPos.x=initial.x;lastPos.y=initial.y;
    var initialPos={};initialPos.x=initial.x;initialPos.y=initial.y;
    var lastHolderPos={};lastHolderPos.x=initial.x;lastHolderPos.y=initial.y;
  }
  var myEvent = new CustomEvent("changey", {'detail':{'target':element,'initial':initial}});

  var limiter=0;
  if (kind=='knob') {
    limiter=156;
  }else if (kind=='slider') {
    if (direction=='vertical') {
      limiter=element.parentNode.clientHeight;
    }
    else if(direction=='horizontal') {
      limiter=element.parentNode.clientWidth;
    }
  }
  else if(kind=='pad') {
    limiter={};
    limiter.x=element.parentNode.clientWidth;
    limiter.y=element.parentNode.clientHeight;
  }

    // Handle the start of gestures 
    this.handleGestureStart = function(evt) {
    evt.preventDefault();


    var point = getGesturePointFromEvent(evt);
    
    if(direction=='vertical') {
      initialPos = point.y;
    }
    else if(direction=='horizontal') {
      initialPos = point.x;
    }
    else if(direction=='both') {
      initialPos.x=point.x;
      initialPos.y=point.y;
    }
    
    if (!window.PointerEventsSupport) {
        // Add Mouse Listeners
        document.addEventListener('mousemove', this.handleGestureMove, true);
        document.addEventListener('mouseup', this.handleGestureEnd, true);
      }

      element.style.border="3px solid black";
      if(kind=='knob') {
        element.childNodes[0].style.border="3px solid black";
      }
      element.style.backgroundColor="yellow";

    }.bind(this);

    this.handleGestureEnd = function(evt) {
      evt.preventDefault();

      if(evt.targetTouches && evt.targetTouches.length > 0) {
        return;
      }
      
      if (!window.PointerEventsSupport) {  
        // Remove Mouse Listeners
        document.removeEventListener('mousemove', this.handleGestureMove, true);
        document.removeEventListener('mouseup', this.handleGestureEnd, true);
      }

      if(kind=='knob') {
        element.style.border="3px solid grey";
        element.childNodes[0].style.border="3px solid grey";
        element.style.backgroundColor=color;
      }
      else if(kind=='slider'){
        element.style.border="none";
        element.style.backgroundColor=color;
      }
      else if(kind=='pad') {
        element.style.border="3px solid "+color;
        element.style.backgroundColor='whitesmoke';
      }
      

      isAnimating = false;
      if(direction!='both') {
        lastHolderPos = lastHolderPos + -(initialPos - lastPos);
        lastHolderPos=limitValueToWydget(lastHolderPos, null);
      }
      else{
        lastHolderPos.x=lastHolderPos.x + -(initialPos.x - lastPos.x);
        lastHolderPos.x=limitValueToWydget(lastHolderPos.x, 'x');
        lastHolderPos.y=lastHolderPos.y + -(initialPos.y - lastPos.y);
        lastHolderPos.y=limitValueToWydget(lastHolderPos.y, 'y');
      }
    }.bind(this);

    this.handleGestureMove = function(evt) {
      evt.preventDefault();
      
      var point = getGesturePointFromEvent(evt);
      if(direction=='vertical') {
        lastPos = point.y;
      }
      else if(direction=='horizontal') {
        lastPos = point.x;
      }
      else if (direction=="both") {
        lastPos.x=point.x;
        lastPos.y=point.y;
      }

      if(isAnimating) {
        return;
      }

      isAnimating = true;
      window.requestAnimFrame(onAnimFrame);

    }.bind(this);


    function getGesturePointFromEvent(evt) {
      var point = {};

      if(evt.targetTouches) {
          // Prefer Touch Events
          point.x = evt.targetTouches[0].clientX;
          point.y = evt.targetTouches[0].clientY;
        } else {
          // Either Mouse event or Pointer Event
          point.x = evt.clientX;
          point.y = evt.clientY;
        }

        return point;
    }


    function onAnimFrame() {
      if(!isAnimating) {
        return;
      }
      if(direction!='both') {
        var newTransform = lastHolderPos + -(initialPos - lastPos);
        newTransform = limitValueToWydget(newTransform, null);
        element.setAttribute('data-value',newTransform);
      }
      else{
        var newTransform={};
        newTransform.x=lastHolderPos.x + -(initialPos.x - lastPos.x);
        newTransform.x = limitValueToWydget(newTransform.x, 'x');
        newTransform.y=lastHolderPos.y + -(initialPos.y - lastPos.y);
        newTransform.y = limitValueToWydget(newTransform.y, 'y');
        element.setAttribute('data-value',""+newTransform.x+","+newTransform.y)
      }
      
      element.dispatchEvent(myEvent);

      if(kind=='knob') {
        if(initial==0) {
          var transformStyle = 'rotate('+ -(newTransform*2)+'deg)';
        }
        else{
          var transformStyle = 'rotate('+ -(newTransform*2-156)+'deg)';
        }
      }
      else if(kind=='slider'){
        if(direction=='vertical') {
          var transformStyle = 'translateY('+newTransform+'px)';
        }
        else if(direction=='horizontal') {
          var transformStyle = 'translateX('+newTransform+'px)';
        }
      }
      else if(kind=='pad') {
        var transformStyle='translate('+newTransform.x+'px, '+newTransform.y+'px)';
      }
      element.style.msTransform = transformStyle;
      element.style.MozTransform = transformStyle;
      element.style.webkitTransform = transformStyle;
      element.style.transform = transformStyle;
      
      isAnimating = false;
    }

    function limitValueToWydget(value, dir) {
      if(!dir) {
        if(kind=='knob') {
          if(initial==0) {
            if(value > limiter/2) {value = limiter/2;} 
            else if(value < -(limiter/2)) {value = -(limiter/2);}
          }
          else{
            if(value<0){value=0;}
            else if(value>limiter){value=limiter;}
          }
        }
        else{
          if(value > limiter) {
            value = limiter;
          } else if(value < 0) {
            value = 0;
          }
        }
      }
      else{
        if(dir=='x'){
          if(value>limiter.x) {
            value=limiter.x;
          } else if(value<0) {
            value=0;
          }
        }
        else if(dir=='y'){
          if(value>limiter.y) {
            value=limiter.y;
          } else if(value<0) {
            value=0;
          }
        }
      }
      return value;
    }

    if(kind=='pad') {elementHold=element.parentNode;}
    else{elementHold=element}
    // Check if pointer events are supported.
    if (window.PointerEventsSupport) {
        // Add Pointer Event Listener
        elementHold.addEventListener(pointerDownName, this.handleGestureStart, true);
        elementHold.addEventListener(pointerMoveName, this.handleGestureMove, true);
        elementHold.addEventListener(pointerUpName, this.handleGestureEnd, true);
      } else {
        // Add Touch Listeners
        elementHold.addEventListener('touchstart', this.handleGestureStart, true);
        elementHold.addEventListener('touchmove', this.handleGestureMove, true);
        elementHold.addEventListener('touchend', this.handleGestureEnd, true);
        elementHold.addEventListener('touchcancel', this.handleGestureEnd, true);

        // Add Mouse Listeners
        elementHold.addEventListener('mousedown', this.handleGestureStart, true);
      }
  
  }//Wydget object

  
initWydget=function() {

  var vsliders=document.querySelectorAll('.wydget-v-slider');
  for(var i=0; i<vsliders.length; i++) {
    vsliders[i].setAttribute('data-value',0);
    //create display element
    var display=document.createElement('DIV');
    vsliders[i].appendChild(display)
    display.innerHTML="0";
    display.style.cssText="color:black;position:relative;left:-43%;text-align:center";

    //create background bar
    var bar=document.createElement('DIV');
    vsliders[i].appendChild(bar);
    bar.style.cssText="width:6px;height:100%;background-color:rgb(155,155,155);margin:20px 0;"
    bar.className='wy-bar';
    
    //check if reverse
    var initial = vsliders[i].clientHeight;
    if (vsliders[i].classList.contains('wydget-alternate')) {
      initial=0;
    }

    //create the circle
    var pin=document.createElement('DIV');
    vsliders[i].appendChild(pin);
    var color=pin.parentNode.style.color;
    if(!color){color='blue';}
    pin.style.cssText="position:relative;top:-100%;margin-top:-39px;left:-43%;border-radius:100%;width:40px;height:40px;background-color:"+color+";transform:translateY("+initial+"px);";
    pin.className='wy-pin';
    new Wydget(pin, color, initial, 'vertical', 'slider');
    
    //add listener for custom event
    pin.addEventListener("changey", function(e){
      var el=e.detail.target;
      var val=el.getAttribute('data-value');
      var text=Math.round(val/el.previousSibling.clientHeight*100);
          if(e.detail.initial!=0) {
            text=Math.abs(100-text);
          }
      el.previousSibling.previousSibling.innerHTML=text;

    }, false);   
  };



  var hsliders=document.querySelectorAll('.wydget-h-slider');
  for(var i=0; i<hsliders.length; i++) {
    hsliders[i].setAttribute('data-value',0);
    //create display element
    var display=document.createElement('DIV');
    hsliders[i].appendChild(display)
    display.innerHTML="0";
    display.style.cssText="color:black;position:relative;left:-30px;top:15px;";

    //create background bar
    var bar=document.createElement('DIV');
    hsliders[i].appendChild(bar);
    bar.style.cssText="height:6px;width:100%;background-color:rgb(155,155,155);margin:0 20px;"
    bar.className='wy-bar';
    
    //check if reverse
    var initial = 0;
    if (hsliders[i].classList.contains('wydget-alternate')) {
      initial=hsliders[i].clientWidth;
    }

    //create the circle
    var pin=document.createElement('DIV');
    hsliders[i].appendChild(pin);
    var color=pin.parentNode.style.color;
    if(!color){color='blue';}
    pin.style.cssText="position:relative;margin-top:-23px;border-radius:100%;width:40px;height:40px;background-color:"+color+";transform:translateX("+initial+"px);";
    pin.className='wy-pin';
    new Wydget(pin, color, initial, 'horizontal', 'slider');
    
    //add listener for custom event
    pin.addEventListener("changey", function(e){
      var el=e.detail.target;
      var val=el.getAttribute('data-value');
      var text=Math.round(val/el.previousSibling.clientWidth*100);
          if(e.detail.initial!=0) {
            text=Math.abs(100-text);
          }
      el.previousSibling.previousSibling.innerHTML=text;

    }, false); 
  };



  var knobs=document.querySelectorAll('.wydget-knob');
  for(var i=0; i<knobs.length; i++) {
    knobs[i].setAttribute('data-value',0);
    //make display div
    var display=document.createElement('DIV');
    knobs[i].appendChild(display)
    display.innerHTML="0";
    display.style.cssText="color:black;position:relative;top:75px;text-align:center;";

    var initial= 156;
    if (knobs[i].classList.contains('wydget-alternate')) {
      initial=0;
    }

    //make knobs
    var knob=document.createElement('DIV');
    knobs[i].appendChild(knob);
    var color=knob.parentNode.style.color;
    if(!color){color='blue';}
    knob.style.cssText="position:relative;margin-top:-23px;border-radius:100%;width:70px;height:70px;background-color:"+color+";transform:rotate("+(initial*-1)+"deg);border:3px solid grey;";
    knob.className='wy-knob';
    new Wydget(knob, color, initial, 'vertical', 'knob');

    //make line
    var line=document.createElement('DIV');
    knob.appendChild(line);
    line.style.cssText="height: 30px;border: 3px solid grey;width: 0px;left: 29px;position: relative;";
    //custom event listener
    knob.addEventListener("changey", function(e){
      var el=e.detail.target;
      var val = el.getAttribute('data-value');
      var text=Math.round(-(val*1.28));
          if(e.detail.initial!=0) {
            text=Math.round(-(val*.64)+100);
          }
      el.previousSibling.innerHTML=text;

    }, false); 
  };



  var pads=document.querySelectorAll('.wydget-pad');
  for(var i=0; i<pads.length; i++) {
    pads[i].setAttribute('data-value',0);
    
    var pad=document.createElement('DIV');
    pads[i].appendChild(pad);
    pad.style.cssText='width:100%;height:100%;background-color:rgba(0,0,0,0.3);border:3px solid grey;border-radius:3px;overflow:hidden;';

    var initial={};
    initial.x=0;
    initial.y=pad.clientHeight;

    var circle=document.createElement('DIV');
    pad.appendChild(circle);
    var color=pad.parentNode.style.color;
    if(!color){color='blue';}
    circle.style.cssText='position:relative;margin-top:-10px;margin-left:-10px;width:20px;height:20px;border:3px solid '+color+';border-radius:100%;background-color:whitesmoke;transform:translate(0px, '+initial.y+'px)';
    new Wydget(circle, color, initial, 'both', 'pad')

    //make display div
    var display=document.createElement('DIV');
    pads[i].appendChild(display);
    display.innerHTML="0, 0";
    display.style.cssText="color:black;position:relative;top:8px;text-align:center;";

    circle.addEventListener("changey", function(e){
      var el=e.detail.target;
      var valley = el.getAttribute('data-value');
      var val=valley.split(",");
      var t1=Math.round(val[0]/el.parentNode.clientWidth*100);
      var t2=Math.abs(100-(Math.round(val[1]/el.parentNode.clientHeight*100)));
      var text=t1+", "+t2;
      el.parentNode.nextSibling.innerHTML=text;

    }, false); 
  }


}//end initWidget

initWydget();
