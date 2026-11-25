// Geometric illustration for a reviewed approximate whole-load policy.
// No density, vehicle payload, purchase quote, eligibility or delivery prediction.
function bounded(value,min,max,label){
 if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max)throw new Error(label);
 return value;
}
export function estimateWholeLoadUse(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Enter an area and a depth for the illustration.");
 const area=bounded(input.areaSquareFeet,1,1000000,"Enter an area from 1 to 1,000,000 square feet.");
 const depth=bounded(input.depthInches,0.25,36,"Enter a chosen depth from 0.25 to 36 inches.");
 const load=bounded(input.approximateLoadCubicYards,Number.MIN_VALUE,1000,"This illustration needs a positive reviewed load volume up to 1,000 cubic yards.");
 const requiredCubicFeet=area*depth/12;
 const requiredCubicYards=requiredCubicFeet/27;
 const delta=load-requiredCubicYards;
 if(![requiredCubicFeet,requiredCubicYards,delta,requiredCubicYards/load,load*27/(depth/12)].every(Number.isFinite))throw new Error("These values exceed the numeric range of this illustration.");
 const same=Math.abs(delta)<=Math.max(1,load)*1e-12;
 return Object.freeze({
  kind:same?"matches_nominal_load":delta>0?"less_than_nominal_load":"more_than_nominal_load",
  approximate:true,areaSquareFeet:area,depthInches:depth,approximateLoadCubicYards:load,
  requiredCubicFeet,requiredCubicYards,nominalLoadFraction:requiredCubicYards/load,
  nominalRemainderCubicYards:Math.max(0,delta),nominalShortfallCubicYards:Math.max(0,-delta),
  geometricCoverageSquareFeet:load*27/(depth/12),
  availability:"UNVERIFIED"
 });
}
