export class WatchdogEngine {
  constructor(clock=()=>new Date().toISOString()){
    this.clock=clock; this.running=false; this.pid=null; this.seq=0; this.events=[];
    this.stats={checks:0,starts:0,restarts:0,duplicatesAvoided:0};
  }
  emit(event,detail,state='OK'){const e={seq:++this.seq,at:this.clock(),event,detail,state};this.events.push(e);return e;}
  check(){
    this.stats.checks++;
    if(this.running){
      this.stats.duplicatesAvoided++;
      this.emit('HEALTHY','Existing process pid='+this.pid+'; no duplicate start','OK');
      return {status:'healthy',pid:this.pid};
    }
    const previous=this.pid;
    this.pid=Math.floor(1000+Math.random()*8000);
    this.running=true;
    if(previous!==null){this.stats.restarts++; this.emit('RESTARTED','Process restarted with pid='+this.pid,'RECOVERED'); return {status:'restarted',pid:this.pid};}
    this.stats.starts++; this.emit('STARTED','Process started with pid='+this.pid,'OK'); return {status:'started',pid:this.pid};
  }
  crash(){
    if(!this.running){this.emit('CRASH_IGNORED','No process was running','BLOCKED');return {status:'absent'};}
    const old=this.pid; this.running=false; this.emit('PROCESS_EXITED','Simulated crash pid='+old,'FAILED'); return {status:'crashed',pid:old};
  }
  reset(){this.running=false;this.pid=null;this.seq=0;this.events=[];this.stats={checks:0,starts:0,restarts:0,duplicatesAvoided:0};}
}