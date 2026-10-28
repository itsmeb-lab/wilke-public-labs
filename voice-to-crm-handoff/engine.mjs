/**
 * Voice-to-CRM Handoff Lab: synthetic fixtures and local, in-memory routing only.
 * No real calls, customer data, CRM writes, notifications, network APIs, or money.
 */
export const SCENARIOS = Object.freeze({
  appointment: {
    title: 'Book a service visit', summary: 'Daytime appointment request goes to scheduling review.',
    call: { id:'DEMO-CALL-1001', at:'2026-10-28T14:30:00Z', caller:'+12125550105', intent:'appointment', consentSms:true, urgent:false }
  },
  duplicate: {
    title: 'Duplicate webhook', summary: 'A carrier retry must not create a second lead.',
    call: { id:'DEMO-CALL-1002', at:'2026-10-28T14:30:00Z', caller:'+12125550106', intent:'appointment', consentSms:true, urgent:false }
  },
  afterHours: {
    title: 'After-hours callback', summary: 'An evening inquiry cannot silently become a confirmed booking.',
    call: { id:'DEMO-CALL-1003', at:'2026-10-29T02:30:00Z', caller:'+12125550107', intent:'estimate', consentSms:true, urgent:false }
  },
  noConsent: {
    title: 'No SMS permission', summary: 'An inquiry may route, but no SMS acknowledgment is eligible.',
    call: { id:'DEMO-CALL-1004', at:'2026-10-28T14:30:00Z', caller:'+12125550108', intent:'estimate', consentSms:false, urgent:false }
  },
  urgent: {
    title: 'Human escalation', summary: 'Urgent requests go to human review, never an automated booking.',
    call: { id:'DEMO-CALL-1005', at:'2026-10-28T14:30:00Z', caller:'+12125550109', intent:'urgent', consentSms:false, urgent:true }
  },
  invalid: {
    title: 'Bad input rejected', summary: 'Invalid caller data is rejected before an owner handoff.',
    call: { id:'DEMO-CALL-1006', at:'2026-10-28T14:30:00Z', caller:'no-phone-number', intent:'appointment', consentSms:true, urgent:false }
  }
});
const validPhone = phone => typeof phone === 'string' && /^\+1[2-9]\d{2}55501\d{2}$/.test(phone);
const traceEntry = (step,result,detail) => ({step,result,detail});

export function isBusinessHours(iso,timeZone='America/New_York') {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return false;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone,weekday:'short',hour:'2-digit',hourCycle:'h23'
  }).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return !['Sat','Sun'].includes(parts.weekday) && Number(parts.hour)>=9 && Number(parts.hour)<17;
}

export class SyntheticHandoff {
  #accepted = new Map();
  process(call) {
    const trace=[traceEntry('RECEIVE','OK','Synthetic inbound event received in memory.')];
    if (!call || typeof call.id!=='string' || !/^DEMO-CALL-\d{4}$/.test(call.id) ||
        !validPhone(call.caller) || !['appointment','estimate','urgent'].includes(call.intent) ||
        !call.at || Number.isNaN(Date.parse(call.at))) {
      trace.push(traceEntry('VALIDATE','REJECTED','Malformed or missing synthetic input. No handoff created.'));
      return this.#makeReceipt(call?.id || 'INVALID','VALIDATION_REJECTED','No owner action','NONE',trace,false);
    }
    trace.push(traceEntry('VALIDATE','OK','Event shape, caller reference and time are valid.'));
    if (this.#accepted.has(call.id)) {
      const first=this.#accepted.get(call.id);
      trace.push(traceEntry('DEDUPE','SUPPRESSED','Existing receipt '+first.receiptId+' reused; no second handoff.'));
      return this.#makeReceipt(call.id,'REPLAY_SUPPRESSED',first.owner,'NONE',trace,false,first.receiptId);
    }
    trace.push(traceEntry('DEDUPE','OK','No matching accepted call ID in this synthetic session.'));
    let status,owner;
    if (call.urgent || call.intent==='urgent') {
      status='HUMAN_REVIEW_REQUIRED';owner='Human escalation desk';
      trace.push(traceEntry('ROUTE','HUMAN_REVIEW','Urgency flagged; automated appointment confirmation blocked.'));
    } else if (!isBusinessHours(call.at)) {
      status='CALLBACK_REVIEW_REQUIRED';owner='Next-business-day callback desk';
      trace.push(traceEntry('ROUTE','CALLBACK','Outside simulated service hours; no appointment promised.'));
    } else {
      status='OWNER_REVIEW_REQUIRED';owner=call.intent==='appointment'?'Scheduling desk':'Estimates desk';
      trace.push(traceEntry('ROUTE','REVIEW','An owner must accept this proposed handoff; no booking confirmed.'));
    }
    const sms=call.consentSms && !call.urgent && call.intent!=='urgent' ? 'PREVIEW_ONLY':'SUPPRESSED';
    trace.push(traceEntry('ACKNOWLEDGE',sms,sms==='PREVIEW_ONLY' ?
      'Acknowledgment eligibility preview only; nothing composed, queued or sent.':
      'No SMS action due to consent or escalation safeguards.'));
    trace.push(traceEntry('RECEIPT','IN_MEMORY','Trace displayed only; no server, CRM or database write.'));
    const receipt=this.#makeReceipt(call.id,status,owner,sms,trace,true);
    this.#accepted.set(call.id,receipt);
    return receipt;
  }
  #makeReceipt(callId,status,owner,sms,trace,handoff,priorReceiptId=null) {
    return { receiptId:priorReceiptId || 'SIM-'+String(callId).replace(/[^A-Z0-9-]/g,'').slice(0,36),
      callId:String(callId),status,owner,sms,handoffCreated:handoff,
      externalCalls:0,persisted:false,data:'synthetic only',trace };
  }
}
export function simulateScenario(key) {
  if (!Object.hasOwn(SCENARIOS,key)) throw new RangeError('Unknown demo scenario');
  const instance=new SyntheticHandoff();
  const call=SCENARIOS[key].call;
  const first=instance.process(call);
  return key==='duplicate' ? {receipt:instance.process(call),first} : {receipt:first,first:null};
}
