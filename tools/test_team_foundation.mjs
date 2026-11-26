import assert from "node:assert/strict";
import {initialTeam,validTeam,chooseTeamWeapon,chooseTeamArmour,teamSnapshots,
  awardTeamPractice,activateTeamPractice,upgradeTeam,previewTeamUpgrade,MAX_TEAM_UPGRADES} from "../site/play/team.mjs";
import {ARMOUR_SLOTS} from "../site/play/armour.mjs";
import {STARTER_ITEM,equipmentPrice} from "../site/play/smith.mjs";
import {EXPERTISE_BALANCE} from "../site/play/expertise.mjs";

export function runTeamTests(api){
  const {assert,initialTeam,validTeam,chooseTeamWeapon,chooseTeamArmour,teamSnapshots,
    awardTeamPractice,activateTeamPractice,upgradeTeam,previewTeamUpgrade,MAX_TEAM_UPGRADES,ARMOUR_SLOTS,STARTER_ITEM,equipmentPrice,EXPERTISE_BALANCE}=api;
  let checks=0;
  function equal(a,b){assert.deepEqual(a,b);checks++;}
  function throws(f){assert.throws(f);checks++;}
  const team=initialTeam(),original=JSON.stringify(team),shared={str:45,dex:42,end:39,skill:17,difficulty:3};
  equal(validTeam(team),true);
  equal(team.first.equipment.bow===team.second.equipment.bow,false);
  equal(team.first.expertise===team.second.expertise,false);
  equal(team.first.armour===team.second.armour,false);
  const s=teamSnapshots(team,shared);
  for(const k of ["str","dex","end","skill","difficulty"])equal(s.first[k],s.second[k]);
  equal(s.first.loadout,"greatsword");equal(s.second.loadout,"bow");
  const switched=chooseTeamWeapon(team,"first","hammer");
  equal(switched.second,team.second);equal(s.first.loadout,"greatsword");
  const trained=awardTeamPractice(switched,s,{first:3600000,second:1800000});
  equal(trained.first.expertise.greatsword,EXPERTISE_BALANCE.unitsPerHour);
  equal(trained.first.expertise.hammer,0);equal(trained.first.expertise.bow,0);
  equal(trained.second.expertise.bow,EXPERTISE_BALANCE.unitsPerHour/2);
  equal(trained.second.expertise.greatsword,0);
  equal(trained.first.expertiseActive.greatsword,0);
  equal(activateTeamPractice(trained).first.expertiseActive.greatsword,EXPERTISE_BALANCE.unitsPerHour);
  equal(chooseTeamWeapon(trained,"first","greatsword").first.expertise.greatsword,EXPERTISE_BALANCE.unitsPerHour);
  const idle=awardTeamPractice(trained,s,{first:0,second:0});
  equal(idle,trained);
  const upgrades=upgradeTeam(team,90,1);
  equal(upgrades.spent,90);equal(upgrades.coins,0);
  equal(upgrades.team.first.equipment.greatsword.quality,"common");equal(upgrades.team.second.equipment.bow.quality,"common");
  equal(upgrades.team.first.equipment.bow,STARTER_ITEM);equal(upgrades.team.second.equipment.greatsword,STARTER_ITEM);
  equal(upgrades.upgrades.map(x=>x.id),["first","second"]);
  equal(upgradeTeam(team,44,1).spent,0);
  equal(previewTeamUpgrade(team,45,1).quote.available,true);
  const fully=initialTeam();
  for(const id of ["first","second"])for(const {id:slot} of ARMOUR_SLOTS){
    fully[id].armour[slot]="leather";fully[id].equipment[slot+":leather"]={...STARTER_ITEM};
    fully[id].equipment[slot+":plate"]={...STARTER_ITEM};
  }
  const all=upgradeTeam(fully,10000000,50);
  equal(all.upgrades.length,MAX_TEAM_UPGRADES);equal(MAX_TEAM_UPGRADES,310);
  equal(all.spent,10*equipmentPrice({grade:7,quality:"masterwork"}));equal(all.coins,10000000-all.spent);
  equal(all.next,null);equal(all.upgrades.reduce((n,x)=>n+x.cost,0),all.spent);
  for(const id of ["first","second"])for(const {id:slot} of ARMOUR_SLOTS){
    equal(all.team[id].equipment[slot+":leather"],{grade:7,quality:"masterwork"});
    equal(all.team[id].equipment[slot+":plate"],STARTER_ITEM);
  }
  const capped=upgradeTeam(fully,10000000,1);
  equal(capped.upgrades.length,30);equal(capped.next.quote.reason,"fighting_level");
  const change=chooseTeamArmour(fully,"first","head","plate");
  equal(change.first.armour.head,"plate");equal(change.second.armour.head,"leather");
  equal(teamSnapshots(change,shared).first.condition.armour.head.itemId,"head:plate");
  throws(()=>chooseTeamArmour(team,"first","head","plate"));
  throws(()=>chooseTeamWeapon(team,"third","bow"));
  throws(()=>chooseTeamWeapon(team,"first","magic"));
  throws(()=>upgradeTeam(team,-1,1));
  throws(()=>awardTeamPractice(team,s,{first:0,second:-1}));
  equal(validTeam({...team,third:team.first}),false);
  equal(validTeam({...team,first:{...team.first,equipment:{...team.first.equipment,magic:STARTER_ITEM}}}),false);
  equal(validTeam({...team,first:{...team.first,expertiseActive:{...team.first.expertiseActive,bow:1}}}),false);
  equal(JSON.stringify(team),original);
  return {checks,automaticPurchases:all.upgrades.length,fullTeamCost:all.spent};
}
console.log(JSON.stringify(runTeamTests({assert,initialTeam,validTeam,chooseTeamWeapon,chooseTeamArmour,teamSnapshots,
  awardTeamPractice,activateTeamPractice,upgradeTeam,previewTeamUpgrade,MAX_TEAM_UPGRADES,ARMOUR_SLOTS,STARTER_ITEM,equipmentPrice,EXPERTISE_BALANCE})));
