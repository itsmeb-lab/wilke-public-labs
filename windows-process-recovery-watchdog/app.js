import {WatchdogEngine} from './core.mjs';
const engine=new WatchdogEngine(),$=id=>document.getElementById(id);
let phase=0;
const els={state:$('state'),pid:$('pid'),starts:$('starts'),restarts:$('restarts'),dupes:$('dupes'),log:$('receiptLog'),count:$('receiptCount'),step:$('stepBtn'),instruction:$('instruction'),beat:$('beat')};
const labels=[
  ['01 / ABSENT','Run watchdog check','No process is running. The watchdog should start exactly one.'],
  ['02 / RUNNING','Check again — prove no duplicate','The process is healthy. A second check must not create another PID.'],
  ['03 / HEALTHY','Simulate process crash','Now break the sandbox process on purpose.'],
  ['04 / CRASHED','Run recovery check','The process is gone. The next watchdog cycle should restart it with a new PID.'],
  ['05 / RECOVERED','Replay the proof','Recovery proved. Replay from the beginning if you want to inspect it again.']
];
function render(){
  els.state.textContent=engine.running?(phase===4?'RECOVERED':'RUNNING'):(phase===3?'CRASHED':'ABSENT');
  els.pid.textContent=engine.running?engine.pid:'—';
  els.starts.textContent=engine.stats.starts;els.restarts.textContent=engine.stats.restarts;els.dupes.textContent=engine.stats.duplicatesAvoided;
  els.beat.textContent=labels[phase][0];els.step.textContent=labels[phase][1];els.instruction.textContent=labels[phase][2];
  els.count.textContent=engine.events.length+' receipts';
  els.log.innerHTML=engine.events.length?engine.events.slice().reverse().map((e,i)=>'<div class="log-line '+(i===0?'latest':'')+'"><time>'+new Date(e.at).toLocaleTimeString()+'</time><code>'+e.event+'</code><span>'+e.detail+'</span><b>'+e.state+'</b></div>').join(''):'<div class="log-empty">No receipts yet. Run the first watchdog check.</div>';
}
function next(){
  if(phase===0){engine.check();phase=1;}
  else if(phase===1){engine.check();phase=2;}
  else if(phase===2){engine.crash();phase=3;}
  else if(phase===3){engine.check();phase=4;}
  else {engine.reset();phase=0;}
  render();
}
$('stepBtn').onclick=next;
$('resetBtn').onclick=()=>{engine.reset();phase=0;render();};
render();