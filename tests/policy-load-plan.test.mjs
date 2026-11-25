import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateWholeLoadUse } from "../published-policy-lab/load-plan.mjs";
import { validateCatalog,answerPolicy } from "../published-policy-lab/engine.mjs";
import { catalog } from "../published-policy-lab/data.mjs";
const base={areaSquareFeet:200,depthInches:3,approximateLoadCubicYards:20};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,JSON.stringify({a,b}));
test("a small area is compared with a full nominal load instead of becoming a small order",()=>{
 const r=estimateWholeLoadUse(base);near(r.requiredCubicFeet,50);near(r.requiredCubicYards,50/27);
 near(r.nominalRemainderCubicYards,20-50/27);near(r.geometricCoverageSquareFeet,2160);near(r.nominalLoadFraction,(50/27)/20);
 assert.equal(r.kind,"less_than_nominal_load");assert.equal(r.approximate,true);assert.equal(r.availability,"UNVERIFIED");
 assert.equal(Object.hasOwn(r,"recommendedOrder"),false);assert.equal(Object.hasOwn(r,"weight"),false);assert.equal(Object.hasOwn(r,"cost"),false);
});
test("one cubic yard uses 27 cubic feet without treating a rounded source coverage rule as exact",()=>{
 const r=estimateWholeLoadUse({...base,areaSquareFeet:162,depthInches:2,approximateLoadCubicYards:1});
 near(r.requiredCubicFeet,27);near(r.requiredCubicYards,1);assert.equal(r.kind,"matches_nominal_load");
});
test("a nominal match does not become approval or an availability claim",()=>{
 const r=estimateWholeLoadUse({...base,areaSquareFeet:2160});near(r.requiredCubicYards,20);near(r.nominalRemainderCubicYards,0);
 assert.equal(r.kind,"matches_nominal_load");assert.equal(r.availability,"UNVERIFIED");assert.equal(Object.hasOwn(r,"eligible"),false);
});
test("an area larger than one nominal load records a shortfall without scheduling extra loads",()=>{
 const r=estimateWholeLoadUse({...base,areaSquareFeet:4320});near(r.requiredCubicYards,40);near(r.nominalShortfallCubicYards,20);
 assert.equal(r.nominalRemainderCubicYards,0);assert.equal(r.kind,"more_than_nominal_load");assert.equal(Object.hasOwn(r,"deliveries"),false);
});
test("numeric input is explicit; empty, coercible, nonfinite and out-of-range values refuse",()=>{
 for(const [key,values]of [["areaSquareFeet",[null,"200",NaN,Infinity,0,-1,1000001]],["depthInches",[null,"3",NaN,Infinity,0,0.24,36.1]],["approximateLoadCubicYards",[null,"20",NaN,Infinity,0,-1,1001]]])
  for(const value of values)assert.throws(()=>estimateWholeLoadUse({...base,[key]:value}));
 for(const input of [null,[],false,""])assert.throws(()=>estimateWholeLoadUse(input));
});
test("calculation bounds stay finite and the result does not mutate its input",()=>{
 const input=Object.freeze({areaSquareFeet:1000000,depthInches:36,approximateLoadCubicYards:1000});
 const r=estimateWholeLoadUse(input);assert.ok(Object.values(r).filter(x=>typeof x==="number").every(Number.isFinite));assert.ok(Object.isFrozen(r));
 const tiny=estimateWholeLoadUse({...base,areaSquareFeet:1,depthInches:0.25});assert.ok(tiny.requiredCubicYards>0);assert.ok(tiny.requiredCubicYards<0.01);
});
test("only the reviewed delivery policy exposes its source-bound quantity",()=>{
 const p=catalog.places.find(p=>p.id==="wakeforest-woodchips-program");
 const r=answerPolicy(catalog,{placeId:p.id,jurisdictionId:p.jurisdictionId,serviceId:"mulch_delivery"});
 assert.deepEqual(r.wholeLoad,{kind:"approximate_whole_load",approximateCubicYards:20,sourceId:"wakeforest-woodchips"});
 r.wholeLoad.approximateCubicYards=999;assert.equal(p.policies.mulch_delivery.wholeLoad.approximateCubicYards,20);
 const other=answerPolicy(catalog,{placeId:p.id,jurisdictionId:p.jurisdictionId,serviceId:"mulch_pickup"});assert.equal(other.wholeLoad,null);
});
test("quantity metadata cannot detach from its source, task, program or described policy",()=>{
 const copy=()=>JSON.parse(JSON.stringify(catalog));
 for(const mutation of [
  (p,v)=>{v.wholeLoad.sourceId="clemson-mulch";},(p,v)=>{v.wholeLoad.approximateCubicYards="20";},
  (p,v)=>{v.wholeLoad.approximateCubicYards=0;},(p,v)=>{v.wholeLoad.approximateCubicYards=Infinity;},
  (p,v)=>{v.wholeLoad.kind="booked_load";},(p,v)=>{v.fit="unstated";},
  (p,v)=>{p.recordKind="place";},(p,v)=>{p.policies.mulch_pickup.wholeLoad=v.wholeLoad;delete v.wholeLoad;}
 ]){
  const c=copy(),p=c.places.find(p=>p.id==="wakeforest-woodchips-program"),v=p.policies.mulch_delivery;
  mutation(p,v);assert.throws(()=>validateCatalog(c),/whole-load metadata/);
 }
});

test("subnormal load values cannot produce an infinite fraction or coverage claim",()=>{assert.throws(()=>estimateWholeLoadUse({...base,approximateLoadCubicYards:Number.MIN_VALUE}),/numeric range/);});
