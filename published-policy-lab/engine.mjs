// Published-policy projection for the accompanying source snapshot.
// No network calls, booking, legal eligibility decision or live availability check.
export const SERVICES = Object.freeze({
 electronics: "Electronics and TVs",
 farmer_oil: "Farmer oil collection",
 paint: "Paint preparation",
 vehicle_title: "Vehicle-title notarization",
 basic_notary: "Basic notary service",
 printing: "Printing",
 hotspot_borrowing: "Hotspot borrowing",
 things_borrowing: "Library of Things borrowing",
 commercial_meeting: "Commercial or for-profit meeting",
 private_study: "Individual or private study",
 mulch_pickup: "Residential mulch pickup",
 mulch_delivery: "Residential mulch delivery"
});
export const PROGRAM_SCOPE_NOTE = "Program-level rules. Confirm the specific location and current service arrangements with the operator.";
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
export function parseVisitDate(value) {
 if (value === "" || value == null) return null;
 if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Use a date in YYYY-MM-DD format.");
 const [y,m,d] = value.split("-").map(Number);
 if (y < 2000 || y > 2100) throw new Error("This date check covers 2000 through 2100.");
 const t = new Date(Date.UTC(y,m-1,d));
 if (t.getUTCFullYear()!==y || t.getUTCMonth()!==m-1 || t.getUTCDate()!==d) throw new Error("Choose a real calendar date.");
 return Object.freeze({iso:value,year:y,weekday:t.getUTCDay()});
}
export function validateCatalog(catalog) {
 if (!catalog || !Array.isArray(catalog.places) || !Array.isArray(catalog.sources)) throw new Error("Missing policy catalog.");
 if (typeof catalog.snapshotId!=="string" || !catalog.snapshotId || !parseVisitDate(catalog.checkedOn)) throw new Error("Missing snapshot identity or check date.");
 if (catalog.places.length > 100 || catalog.sources.length > 100) throw new Error("Catalog outside lab bounds.");
 const ids = new Set(), src = new Set();
 for (const s of catalog.sources) {
  if (!s || typeof s.id!=="string" || !s.id || src.has(s.id) || typeof s.url!=="string" || !/^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::443)?(?:\/[^\s<>]*)?$/i.test(s.url)) throw new Error("Invalid source record.");
  if (typeof s.label!=="string" || !s.label || !parseVisitDate(s.checkedOn)) throw new Error("Missing source check date.");
  if(s.checkedOn>catalog.checkedOn)throw new Error("A source check cannot follow the snapshot check.");
  src.add(s.id);
 }
 for (const p of catalog.places) {
  if (!p || typeof p.id!=="string" || !p.id || ids.has(p.id) || typeof p.jurisdictionId!=="string" || !p.jurisdictionId || typeof p.region!=="string" || !/^[A-Z]{2}$/.test(p.region) || typeof p.locality!=="string" || !p.locality || typeof p.name!=="string" || !p.name || !p.jurisdictionId.startsWith("us-"+p.region.toLowerCase()+"-")) throw new Error("Invalid place identity.");
  ids.add(p.id);
  if(p.recordKind!=null && !["place","program"].includes(p.recordKind))throw new Error("Invalid record kind.");
  if(p.recordKind==="program" && p.address!=null)throw new Error("Program rules must not imply a specific pickup address.");
  if (!p.policies || typeof p.policies!=="object" || Array.isArray(p.policies)) throw new Error("Missing policies.");
  for (const key of Object.keys(p.policies)) {
   const v=p.policies[key];
   if (!own(SERVICES,key) || !v || !["described","excluded","unstated"].includes(v.fit) || typeof v.summary!=="string" || !Array.isArray(v.sourceIds) || !v.sourceIds.length || v.sourceIds.some(id=>!src.has(id))) throw new Error("Invalid scoped policy.");
   if (v.conditions!=null && (!Array.isArray(v.conditions) || v.conditions.some(x=>typeof x!=="string")))throw new Error("Invalid policy conditions.");
   if (v.fee!=null && typeof v.fee!=="string")throw new Error("Invalid fee description.");
   if (v.redirectPlaceId != null && (typeof v.redirectPlaceId!=="string" || v.fit!=="excluded")) throw new Error("Invalid policy redirect.");
   if(v.wholeLoad!=null){
    const q=v.wholeLoad;
    if(key!=="mulch_delivery"||v.fit!=="described"||p.recordKind!=="program"||!q||typeof q!=="object"||Array.isArray(q)||q.kind!=="approximate_whole_load"||typeof q.approximateCubicYards!=="number"||!Number.isFinite(q.approximateCubicYards)||q.approximateCubicYards<=0||q.approximateCubicYards>1000||typeof q.sourceId!=="string"||!v.sourceIds.includes(q.sourceId))throw new Error("Invalid source-bound whole-load metadata.");
   }
  }
  if(p.schedule) {
   if(!Array.isArray(p.schedule.days) || !p.schedule.days.length || p.schedule.days.some(d=>!Number.isInteger(d)||d<0||d>6) || !src.has(p.schedule.sourceId)) throw new Error("Invalid published schedule.");
   if(typeof p.schedule.label!=="string" || !Array.isArray(p.scheduleAppliesTo) || !p.scheduleAppliesTo.length || p.scheduleAppliesTo.some(key=>!own(SERVICES,key)))throw new Error("Missing schedule scope or label.");
  }
 }
 for(const p of catalog.places)for(const [key,policy] of Object.entries(p.policies)) {
  if(policy.redirectPlaceId != null) {
   const target=catalog.places.find(x=>x.id===policy.redirectPlaceId);
   if(!target || target.jurisdictionId!==p.jurisdictionId || target.policies[key]?.fit!=="described") throw new Error("Redirect must reach a described service in the same jurisdiction.");
  }
 }
 const calendarKeys=new Set();
 if (catalog.closureCalendars!=null && !Array.isArray(catalog.closureCalendars)) throw new Error("Invalid closure calendar list.");
 for(const c of catalog.closureCalendars||[]) {
  if(!c || !Number.isInteger(c.year) || !src.has(c.sourceId) || !Array.isArray(c.dates) || !c.jurisdictionId || !c.group) throw new Error("Invalid closure calendar.");
  if(!catalog.places.some(p=>p.jurisdictionId===c.jurisdictionId && p.scheduleGroup===c.group))throw new Error("Closure calendar has no matching scope.");
  const calendarKey=JSON.stringify([c.jurisdictionId,c.group,c.year]);
  if(calendarKeys.has(calendarKey))throw new Error("Ambiguous closure calendars.");
  calendarKeys.add(calendarKey);
  if(c.coverage!=null && !["published_year","listed_dates_only"].includes(c.coverage))throw new Error("Invalid closure-calendar coverage.");
  if(new Set(c.dates).size!==c.dates.length)throw new Error("Duplicate closure dates.");
  for(const day of c.dates)if(parseVisitDate(day)?.year!==c.year)throw new Error("Closure date outside declared year.");
  if(c.closureLabel!=null && (typeof c.closureLabel!=="string" || !c.closureLabel.trim()))throw new Error("Invalid closure label.");
  if(c.dateNotices!=null && !Array.isArray(c.dateNotices))throw new Error("Invalid date notices.");
  const noticeDates=new Set();
  for(const notice of c.dateNotices||[]){
   if(!notice || notice.kind!=="early_closure" || parseVisitDate(notice.date)?.year!==c.year || typeof notice.label!=="string" || !notice.label.trim())throw new Error("Invalid scoped date notice.");
   if(noticeDates.has(notice.date) || c.dates.includes(notice.date))throw new Error("Ambiguous closure and date notices.");
   noticeDates.add(notice.date);
  }
 }
 return true;
}
function timingFor(catalog, place, serviceId, visit, fit) {
 const base={availability:"UNVERIFIED",label:"Confirm current service arrangements with the operator.",kind:"unconfirmed",sourceIds:[]};
 if(fit!=="described")return {...base,kind:fit==="excluded"?"task_excluded":"task_unconfirmed",label:fit==="excluded"?"This task is excluded by the published rule.":"Confirm the requested service with the operator.",detail:"General opening hours do not change a task restriction or resolve an unstated policy."};
 const regular=place.schedule && place.scheduleAppliesTo.includes(serviceId)?place.schedule:null;
 if(regular){base.sourceIds=[regular.sourceId];base.regularLabel=regular.label;}
 if(!visit)return {...base,detail:regular?"Choose a date to compare it with the published weekday pattern.":"This sample does not establish a service window."};
 const calendar=(catalog.closureCalendars||[]).find(c=>c.jurisdictionId===place.jurisdictionId&&c.group===place.scheduleGroup&&c.year===visit.year);
 if(calendar){
  base.sourceIds.push(calendar.sourceId);
  base.calendarCoverage=calendar.coverage||"listed_dates_only";
  if(calendar.dates.includes(visit.iso))return {...base,kind:"listed_closure",label:calendar.closureLabel||"The county lists this date as a recycling-center closure.",detail:"A listed full-day closure takes priority over usual service hours. Confirm current arrangements with the operator."};
  const notice=calendar.dateNotices?.find(n=>n.date===visit.iso);
  if(notice)return {...base,kind:"listed_early_closure",label:notice.label,detail:"This is a partial-day notice, not a full-day closure or confirmation of room availability. Confirm the specific branch and room cutoff with staff."};
 }
 if(!regular)return {...base,detail:"This sample does not establish a service window. An unlisted date is not proof of access."};
 if(!regular.days.includes(visit.weekday))return {...base,kind:"regular_day_excluded",label:"The selected weekday is outside the published service pattern.",detail:regular.label};
 if(calendar && base.calendarCoverage==="listed_dates_only")return {...base,kind:"exception_data_unknown",label:"The weekday fits the published pattern; other dated exceptions remain unverified.",detail:"Only a partial set of dated exceptions is supplied for this program and year. Confirm the service date with the operator."};
 if(calendar)return {...base,kind:"regular_pattern_only",label:"The weekday matches the published pattern; no closure is listed in the supplied calendar.",detail:"This is a policy snapshot, not confirmation that the site will be accessible."};
 return {...base,kind:"exception_data_unknown",label:"The weekday matches the published pattern; date-specific exceptions are unverified.",detail:"No applicable closure calendar is included for this place and year."};
}
export function answerPolicy(catalog,query) {
 validateCatalog(catalog);
 if(!query || typeof query!=="object" || typeof query.serviceId!=="string" || !own(SERVICES,query.serviceId))throw new Error("Choose a task from this lab.");
 const place=catalog.places.find(p=>p.id===query.placeId);
 if(!place)throw new Error("Choose a place from this snapshot.");
 if(query.jurisdictionId!==place.jurisdictionId)throw new Error("The selected place and jurisdiction do not match.");
 const visit=parseVisitDate(query.visitDate);
 const policy=own(place.policies,query.serviceId)?place.policies[query.serviceId]:null;
 const effective=policy||{fit:"unstated",summary:"This snapshot does not settle this task at the selected place.",sourceIds:[]};
 const timing=timingFor(catalog,place,query.serviceId,visit,effective.fit);
 const sourceIds=[...new Set([...effective.sourceIds,...timing.sourceIds])].sort();
 const redirect=effective.redirectPlaceId?catalog.places.find(p=>p.id===effective.redirectPlaceId):null;
 return {
  kind:"published_policy_projection",snapshotId:catalog.snapshotId,snapshotCheckedOn:catalog.checkedOn,
  place:{id:place.id,name:place.name,region:place.region,locality:place.locality,jurisdictionId:place.jurisdictionId,address:place.address||null,recordKind:place.recordKind||"place"},
  scopeNote:place.recordKind==="program"?PROGRAM_SCOPE_NOTE:null,
  task:SERVICES[query.serviceId],serviceId:query.serviceId,visitDate:visit?.iso||null,
  fit:effective.fit,summary:effective.summary,conditions:effective.conditions||[],
  fee:effective.fee||"Not stated in this checked policy.",feeRecorded:effective.fit==="described" && typeof effective.fee==="string",timing,
  wholeLoad:effective.wholeLoad?{...effective.wholeLoad}:null,
  redirectedPlace:redirect?{id:redirect.id,name:redirect.name,locality:redirect.locality,region:redirect.region}:null,
  sources:catalog.sources.filter(s=>sourceIds.includes(s.id)).map(s=>({id:s.id,label:s.label,url:s.url,checkedOn:s.checkedOn})),
  limits:["Published rules do not establish live availability or a booking.","The operator decides whether a particular request can be handled.","This sample covers selected tasks, places and programs; missing detail remains unknown."]
 };
}
