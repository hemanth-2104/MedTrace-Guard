// Dependency-free specification model for offline education, NOT an Ethereum implementation.
export class ProvenanceModel {
 constructor(){this.now=1800000000;this.batches=[];this.roles={maker:'Manufacturer',distributor:'Distributor',pharmacy:'Pharmacy',regulator:'Regulator'};}
 register(actor,code,units=100,expires=this.now+86400){
  if(this.roles[actor]!=='Manufacturer'||!code||!Number.isInteger(units)||units<=0||expires<=this.now)throw Error('Invalid registration');
  if(this.batches.some(b=>b.manufacturer===actor&&b.code===code))throw Error('Duplicate batch');
  const b={id:this.batches.length+1,code,manufacturer:actor,custodian:actor,stage:0,total:units,remaining:units,expires,recalled:false,hold:false,pending:null,nonce:0,history:[]};this.batches.push(b);this.log(b,'Registered',actor);return b.id;
 }
 batch(id){const b=this.batches[id-1];if(!b)throw Error('Unknown batch');return b;}
 usable(b){if(b.recalled||b.hold||this.now>=b.expires||b.remaining===0)throw Error('Batch blocked');}
 log(b,kind,actor){b.history.push({kind,actor,time:this.now});}
 propose(actor,id,to,deadline=this.now+600){const b=this.batch(id);this.usable(b);
  if(actor!==b.custodian||!this.roles[actor]||b.pending||b.stage>1||this.roles[actor]!==['Manufacturer','Distributor'][b.stage]||this.roles[to]!==['Distributor','Pharmacy'][b.stage]||deadline<=this.now||deadline>this.now+604800||deadline>b.expires)throw Error('Invalid handoff');
  b.pending={to,deadline,nonce:++b.nonce};this.log(b,'Shipment proposed',actor);
 }
 accept(actor,id,nonce){const b=this.batch(id);this.usable(b);const p=b.pending;
  if(!p||p.to!==actor||p.nonce!==nonce||this.now>=p.deadline||this.roles[actor]!==['Distributor','Pharmacy'][b.stage]||this.roles[b.custodian]!==['Manufacturer','Distributor'][b.stage])throw Error('Invalid receipt');
  b.custodian=actor;b.stage++;b.pending=null;this.log(b,'Receipt accepted',actor);
 }
 cancel(actor,id){const b=this.batch(id);if(!b.pending||![b.custodian,b.pending.to].includes(actor)&&this.roles[actor]!=='Regulator')throw Error('Denied');b.pending=null;this.log(b,'Shipment cancelled',actor);}
 dispense(actor,id,n){const b=this.batch(id);this.usable(b);if(actor!==b.custodian||this.roles[actor]!=='Pharmacy'||b.stage!==2||!Number.isInteger(n)||n<=0||n>b.remaining)throw Error('Invalid quantity');b.remaining-=n;if(!b.remaining)b.stage=3;this.log(b,`Dispensed ${n} units`,actor);}
 temperature(actor,id,value){const b=this.batch(id);if(actor!==b.custodian&&this.roles[actor]!=='Regulator'||!this.roles[actor]||b.recalled||!b.remaining||!Number.isFinite(value)||value< -100||value>100)throw Error('Denied');if(value<2||value>8)b.hold=true;this.log(b,`Simulated reading ${value} C`,actor);}
 release(actor,id){const b=this.batch(id);if(this.roles[actor]!=='Regulator'||!b.hold||b.recalled)throw Error('Denied');b.hold=false;this.log(b,'Hold released',actor);}
 recall(actor,id){const b=this.batch(id);if(this.roles[actor]!=='Regulator'||b.recalled)throw Error('Denied');b.recalled=true;b.pending=null;this.log(b,'Recalled',actor);}
}
