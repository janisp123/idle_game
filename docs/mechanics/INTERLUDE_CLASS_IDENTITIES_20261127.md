# Lineage II Interlude — 31-class identity research and adaptation proposal

Date: 2026-11-27. Task CLASS-TERRAIN-001 / BATTLE-GROUP-001. Research only, no new combat implementation or approved coefficients. Baseline candidate 04f3acfe978f3136805c98d6ee6d1136fafc6827 (PR #200). The user's reference is the five-race Interlude era, not Kamael/High Five/Essence. Original level-40 professions and level-76 successors map one-to-one to our 31 original specializations. The game retains original names, existing automatic fixed equipment, seven members, coins-only economy, no mana, and no manual skills.

## Method and source limitations

Cross-check class tree against [Interlude-specific class/skill database](https://lineage2wiki.org/interlude/class/) and [L2 Hub 31 second professions](https://www.l2-hub.com/leveling?c=c1). Individual class skill lists from [Valakas Returns Interlude reference](https://l2valakasreturns.com/en/estilos.html) are linked per class below. These are community/independent-server reconstructions, not an authenticated original NCSoft retail specification. Server-specific costs, exact rates, and numeric tuning are not carried over. Skill names serve as research identifiers, descriptions are paraphrased. Third professions identify the lineage only; no later-chronicle skills assumed. Fixed armour/weapon below is OUR current kit, not a claim that Interlude restricted gear to it. Favourable/unfavourable terrain and target counters are design hypotheses for OUR five arenas, not claims about original Lineage II map-specific multipliers.

## Characteristic cards

### Blademaster — Human

- Reference: [Gladiator / Duelist](https://l2valakasreturns.com/en/clases/gladiator.html).
- Our kit: Twin swords · plate.
- Source identity: Dual-sword mastery, charged sonic attacks, shield-ignoring multi-slash, resistance to control.
- Proposed identity: Disciplined duelist: concentrated multi-hit burst, limited reach pressure between charges.
- Favours: Shield-dependent fighters and exposed frontliners; courtyard.
- Vulnerable to: Kiting, hard control between bursts; open field against distant archers.
- Candidate implementation / existing gap: Current burst lacks sonic reach and partial shield penetration. Give periodic burst a recovery cost; not permanent shield bypass.

### Linebreaker — Human

- Reference: [Warlord / Dreadnought](https://l2valakasreturns.com/en/clases/warlord.html).
- Our kit: Polearm · plate.
- Source identity: Polearm sweeps and area stuns; Battle Roar and single-target Focus Attack.
- Proposed identity: Crowd-control spearman: reach, multi-target disruption, strong choke defence.
- Favours: Clusters of melee and narrow bridge.
- Vulnerable to: Spread shooters, isolated targets, enemies inside polearm reach; open field against bows.
- Candidate implementation / existing gap: Current splash is a start; add bounded sweep stagger or movement disruption. No repeated indefinite stun.

### Oathkeeper — Human

- Reference: [Paladin / Phoenix Knight](https://l2valakasreturns.com/en/clases/paladin.html).
- Our kit: Sword and shield · plate.
- Source identity: Defensive knight, holy abilities and Sacrifice (spends own HP to heal another).
- Proposed identity: Protective tank: intercept arrows and take damage for wounded allies.
- Favours: Archers, assassins targeting allies; bridge/gatehouse.
- Vulnerable to: Armour breakers, attrition and magical pressure; open field against mobile casters.
- Candidate implementation / existing gap: Current ward matches protection. Candidate self-cost protective heal distinguishes it from Grovewarden; cannot replace a healer.

### Grimwarden — Human

- Reference: [Dark Avenger / Hell Knight](https://l2valakasreturns.com/en/clases/dark-avenger.html).
- Our kit: Sword and shield · plate.
- Source identity: Dark Panther companion, shield and offensive pressure, drain.
- Proposed identity: Offensive tank: guards front while a limited shadow strike threatens enemies.
- Favours: Physical attackers, pressure on exposed melee; courtyard/gatehouse.
- Vulnerable to: Magic pressure, isolation from allies, loss of companion utility; open field.
- Candidate implementation / existing gap: Current counter guard does not express companion identity. Consider bounded shadow attack, no extra permanent actor without approval.

### Trickblade — Human

- Reference: [Treasure Hunter / Adventurer](https://l2valakasreturns.com/en/clases/treasure-hunter.html).
- Our kit: Dagger · leather.
- Source identity: Backstab, Deadly Blow, target disruption (Trick/Switch), temporary Dash and evasion.
- Proposed identity: Deceptive burst assassin: quick approach through cover and interrupt target focus before a decisive close strike.
- Favours: Padded-armour mages, healers and archers; ruins/gatehouse.
- Vulnerable to: Intact shields, plate, protected backline; exposed open-field approach.
- Candidate implementation / existing gap: Current feint opens guard. Add bounded target disruption; dagger penetration must not erase tank defence. No instant kills.

### Longshot — Human

- Reference: [Hawkeye / Sagittarius](https://l2valakasreturns.com/en/clases/hawkeye.html).
- Our kit: Bow · leather.
- Source identity: Snipe improves range and offensive precision at the cost of movement; bow stun and rapid fire skills.
- Proposed identity: Stationary marksman: strongest precise long-range volleys when protected; shooting stance trades movement for aim.
- Favours: Exposed casters across open field, straight bridge sightlines.
- Vulnerable to: Shield wall, pursuit, corners and no escape; gatehouse/ruins.
- Candidate implementation / existing gap: Current aimed shot needs stationary tradeoff and clear sightline; avoid general ranged buff.

### Flameweaver — Human

- Reference: [Sorcerer / Archmage](https://l2valakasreturns.com/en/clases/sorcerer.html).
- Our kit: Staff · padded.
- Source identity: Fire attacks and area fire spells, including a surrounding flame attack.
- Proposed identity: Area-burst fire mage: spreads damage across tightly packed enemies; needs cover from allied frontline.
- Favours: Crowded enemies, plate armour; bridge/gatehouse when protected.
- Vulnerable to: Dispersed enemies, contact assassins, exposed open-field arrows.
- Candidate implementation / existing gap: Current blast splash fits. Tune group damage, lower isolated-target burst than Galescourge.

### Gravebinder — Human

- Reference: [Necromancer / Soultaker](https://l2valakasreturns.com/en/clases/necromancer.html).
- Our kit: Staff · padded.
- Source identity: Curses, undead summons and damage transfer to a servitor.
- Proposed identity: Attrition mage: weakens key attackers and uses a limited defensive shadow effect.
- Favours: Sustained teams relying on a few damage dealers; courtyard/bridge.
- Vulnerable to: Cleanse, concentrated burst, isolated contact; gatehouse without tank.
- Candidate implementation / existing gap: Current curse weakens damage. Consider curse plus bounded mitigation; actual summon/damage-transfer mechanic absent.

### Beastcaller — Human

- Reference: [Warlock / Arcana Lord](https://l2valakasreturns.com/en/clases/warlock.html).
- Our kit: Wand · padded.
- Source identity: Cat servitors and support for the summoned creature.
- Proposed identity: Physical companion specialist: steady familiar pressure and utility instead of top direct spell damage.
- Favours: Prolonged skirmishes; protected courtyard/open field.
- Vulnerable to: Burst, control or companion denial; crowded gatehouse if exposed.
- Candidate implementation / existing gap: Current familiar is a signature attack/self-buff, not a pet. Candidate separate bounded familiar action, no free extra fighter.

### Lifekeeper — Human

- Reference: [Bishop / Cardinal](https://l2valakasreturns.com/en/clases/bishop.html).
- Our kit: Scepter · padded.
- Source identity: Dedicated strong single-target and group healing, revival in source game.
- Proposed identity: Pure healer: strongest immediate rescue of wounded allies; weakest personal damage.
- Favours: Sustained damage; behind a tank on bridge or courtyard.
- Vulnerable to: Focus fire, interruption, fast kills; open exposed or unprotected gatehouse.
- Candidate implementation / existing gap: Current single-target heal is strongest of three. Consider limited group heal instead of revival; maintain recipient recovery window.

### Runesage — Human

- Reference: [Prophet / Hierophant](https://l2valakasreturns.com/en/clases/prophet.html).
- Our kit: Scepter · padded.
- Source identity: Broad single-target buffs including attack speed, physical defence and magical defence.
- Proposed identity: Flexible targeted buffer: chooses offensive or protective buff based on stance/ally needs.
- Favours: Mixed teams with exceptional carry; courtyard/bridge.
- Vulnerable to: Isolation, disruption and duplicate nonstacking buffs; spread open field.
- Candidate implementation / existing gap: Current blessing only boosts offense; differentiate stance-based single-target defence vs Warcaller group chant.

### Grovewarden — Elf

- Reference: [Temple Knight / Eva's Templar](https://l2valakasreturns.com/en/clases/temple-knight.html).
- Our kit: Sword and shield · plate.
- Source identity: Spirit Barrier, self-heal, enemy slowing, healing/attack cubics.
- Proposed identity: Magic-resistant guardian: protects against spells and physical projectiles, self-sustains modestly.
- Favours: Magic-heavy teams and ranged pressure; bridge/gatehouse.
- Vulnerable to: Heavy armour breakers, burst beyond mitigation; open field if isolated.
- Candidate implementation / existing gap: Current ward duplicates Oathkeeper. Candidate smaller anti-magic ward/self-heal instead of general duplicate guard.

### Wardchanter — Elf

- Reference: [Swordsinger / Sword Muse](https://l2valakasreturns.com/en/clases/sword-singer.html).
- Our kit: Sword · plate.
- Source identity: Defensive songs for physical defence, evasion, regeneration and elemental resistance.
- Proposed identity: Defensive group support: temporary mitigation and resistance, not a second full tank.
- Favours: Clustered allied frontline, sustained enemy damage; bridge/gatehouse.
- Vulnerable to: Burst before protection, debuff removal, isolation; spread open field.
- Candidate implementation / existing gap: Current ward song covers up to three. Preserve distinct protection category; no stacking infinite mitigation.

### Swiftblade — Elf

- Reference: [Plains Walker / Wind Rider](https://l2valakasreturns.com/en/clases/plains-walker.html).
- Our kit: Dagger · leather.
- Source identity: Backstab, slowing Entangle, Sprint, self-healing and evasion.
- Proposed identity: Mobile pursuit assassin: best of daggers at catching a moving target, less burst than Nightblade.
- Favours: Mobile archers and casters; ruins/courtyard, also close gatehouse.
- Vulnerable to: Plate/shields, control and focused burst; exposed open field still risky.
- Candidate implementation / existing gap: Current dash gives guard only. Candidate actual movement/slow advantage, not teleport; self-heal not mandatory.

### Windbow — Elf

- Reference: [Silver Ranger / Moonlight Sentinel](https://l2valakasreturns.com/en/clases/silver-ranger.html).
- Our kit: Bow · leather.
- Source identity: Sprint, Rapid Fire trades shooting range for power/speed, self-protection magic.
- Proposed identity: Mobile skirmish archer: faster repositioning and shorter-range rapid shots; lower single-hit power.
- Favours: Open field and open lanes; courtyard if room remains.
- Vulnerable to: Tanks and close pursuers; ruins/gatehouse restrict movement.
- Candidate implementation / existing gap: Current mobile shot grants guard but does not move. Tie recovery/retreat to real legal space; no free kiting.

### Frostweaver — Elf

- Reference: [Spellsinger / Mystic Muse](https://l2valakasreturns.com/en/clases/spellsinger.html).
- Our kit: Staff · padded.
- Source identity: Water attacks, freezing damage, sleep and buff removal.
- Proposed identity: Control mage: fast casting, slows or delays advancing foes, less raw burst.
- Favours: Approaching melee, protecting backline; bridge/courtyard.
- Vulnerable to: Ranged focus and immediate contact; exposed gatehouse/open field.
- Candidate implementation / existing gap: Current short stagger exists. Candidate movement slow or timed dispel, with immunity and limited damage.

### Spiritcaller — Elf

- Reference: [Elemental Summoner / Elemental Master](https://l2valakasreturns.com/en/clases/elemental-summoner.html).
- Our kit: Wand · padded.
- Source identity: Unicorn servitors, summon control, water-resistance debuff, supportive summons.
- Proposed identity: Supportive familiar specialist: sustained utility and limited ally recovery/cleanse rather than peak damage.
- Favours: Magic-led mixed groups; bridge/courtyard.
- Vulnerable to: Focused burst, summon disruption and isolation; exposed gatehouse.
- Candidate implementation / existing gap: Current spirit strike heals nearby ally on hit. Consider support pulse or brief anti-control effect; no MP or separate pet economy.

### Wellspring — Elf

- Reference: [Elven Elder / Eva's Saint](https://l2valakasreturns.com/en/clases/elven-elder.html).
- Our kit: Scepter · padded.
- Source identity: Healing, Recharge, Clarity and resistance to stun/poison.
- Proposed identity: Defensive utility healer: removes or prevents disabling effects; less raw healing than Lifekeeper.
- Favours: Control/debuff-heavy teams; protected bridge/courtyard.
- Vulnerable to: Burst and target focus; unprotected gatehouse.
- Candidate implementation / existing gap: Current cleanse heal fits. Translate mana support only into bounded recovery/cooldown assistance if approved; no mana.

### Dreadguard — Dark Elf

- Reference: [Shillien Knight / Shillien Templar](https://l2valakasreturns.com/en/clases/shillien-knight.html).
- Our kit: Sword and shield · plate.
- Source identity: Dark magic, drain/debuff cubics and paralyzing lightning.
- Proposed identity: Disruption tank: intercept arrows and weaken or briefly disable an important attacker.
- Favours: Aggressive physical attackers; gatehouse/bridge.
- Vulnerable to: Armour breakers, cleanses, burst magic; isolated open field.
- Candidate implementation / existing gap: Current weakening strike fits; add brief bounded control only if needed; less pure mitigation than Oathkeeper.

### War Dancer — Dark Elf

- Reference: [Bladedancer / Spectral Dancer](https://l2valakasreturns.com/en/clases/bladedancer.html).
- Our kit: Twin swords · plate.
- Source identity: Dual-sword dances boost attack/casting power and speed; melee lifesteal dance.
- Proposed identity: Offensive group support: boosts allied attack tempo, especially active damage dealers.
- Favours: Mixed offensive teams, tightly coordinated melee; courtyard/bridge.
- Vulnerable to: Isolation, stripping buffs, burst; spread open field.
- Candidate implementation / existing gap: Current war song grants general damage. Candidate offensive tempo/physical synergy distinct from Runesage and Warcaller; no infinite stacking.

### Nightblade — Dark Elf

- Reference: [Abyss Walker / Ghost Hunter](https://l2valakasreturns.com/en/clases/abyss-walker.html).
- Our kit: Dagger · leather.
- Source identity: Backstab, critical damage, bleeding and poison.
- Proposed identity: High-risk execution assassin: strongest flank burst and wounds, least reliable if caught or blocked.
- Favours: Exposed light-armour casters/archers at contact; ruins/gatehouse.
- Vulnerable to: Intact tanks, control, focus fire before contact; open field.
- Candidate implementation / existing gap: Current flank opens guard; differentiate with bounded bleed/high burst, lower sustained survivability. No auto-kill.

### Blackbow — Dark Elf

- Reference: [Phantom Ranger / Ghost Sentinel](https://l2valakasreturns.com/en/clases/phantom-ranger.html).
- Our kit: Bow · leather.
- Source identity: Dead Eye trades attack speed for accuracy and power; Fatal Counter grows stronger at low HP.
- Proposed identity: Heavy-hitting archer: slower decisive shots with risk-reward finishing attack.
- Favours: Exposed casters, clear long lanes; open field/bridge.
- Vulnerable to: Shielded tanks, rapid pursuers, low durability; gatehouse/ruins.
- Candidate implementation / existing gap: Current pierce opens guard. Candidate long recovery and capped wounded-shot power; no automatic shield erasure.

### Galescourge — Dark Elf

- Reference: [Spellhowler / Storm Screamer](https://l2valakasreturns.com/en/clases/spellhowler.html).
- Our kit: Staff · padded.
- Source identity: Wind damage, wind vulnerability curse and HP-draining spell.
- Proposed identity: Heavy single-target wind mage: large magical impact and limited self-sustain, slower recovery.
- Favours: Heavy armour and high-priority targets; courtyard/bridge protected.
- Vulnerable to: Quick interrupts and archers, assassins at contact; exposed gatehouse/open field.
- Candidate implementation / existing gap: Current gust splash overlaps Flameweaver. Prefer single-target wind burst and bounded drain; reduce splash.

### Shadebinder — Dark Elf

- Reference: [Phantom Summoner / Spectral Master](https://l2valakasreturns.com/en/clases/phantom-summoner.html).
- Our kit: Wand · padded.
- Source identity: Shadow and Nightshade servitors, summon-targeting utility.
- Proposed identity: Disruptive familiar specialist: weakens enemy damage or armour from a safe position.
- Favours: Enemy carries, long exchanges; protected courtyard/bridge.
- Vulnerable to: Focus fire and contact melee; unprotected gatehouse.
- Candidate implementation / existing gap: Current shade weakening fits. Keep lower direct damage than mage; distinguish from Gravebinder via bounded familiar utility.

### Bloodsage — Dark Elf

- Reference: [Shillien Elder / Shillien Saint](https://l2valakasreturns.com/en/clases/shillien-elder.html).
- Our kit: Scepter · padded.
- Source identity: Healing/recharge, offensive buffs, Vampiric Rage (ordinary melee damage returns HP).
- Proposed identity: Offensive sustain healer: modest direct healing plus reward for allies landing melee attacks.
- Favours: Melee-heavy offensive groups; courtyard/ruins if protected.
- Vulnerable to: Ranged-only allies, burst and focus; open field without protection.
- Candidate implementation / existing gap: Current heal plus buff fits partially. Candidate limited melee-only lifesteal buff; no general party healing loop.

### Ragebreaker — Orc

- Reference: [Destroyer / Titan](https://l2valakasreturns.com/en/clases/destroyer.html).
- Our kit: Great axe · plate.
- Source identity: Two-handed melee, Guts and Frenzy become available at low HP.
- Proposed identity: Slow berserker: frightening wounded burst or survival window, poor pursuit.
- Favours: Close heavy exchanges; courtyard/ruins/gatehouse.
- Vulnerable to: Kiting, control, focus kill before comeback; open field.
- Candidate implementation / existing gap: Current rage strike unconditional. Candidate bounded low-HP trigger and longer recovery; preserve risk.

### Ironfist — Orc

- Reference: [Tyrant / Grand Khavatari](https://l2valakasreturns.com/en/clases/tyrant.html).
- Our kit: Gauntlets · leather.
- Source identity: Fist weapons and animal totems trading movement, attack, evasion and critical stats.
- Proposed identity: Adaptive brawler: stance changes mobility vs disruption vs burst.
- Favours: Close casters and lightly protected melee; ruins/gatehouse/courtyard.
- Vulnerable to: Plate, shields and ranged kiting; open field without support.
- Candidate implementation / existing gap: Current rush staggers. Candidate stance-specific tradeoffs, no new selection system or free stuns.

### Hexchief — Orc

- Reference: [Overlord / Dominator](https://l2valakasreturns.com/en/clases/overlord.html).
- Our kit: Mace · padded.
- Source identity: Area seals reduce movement/attack speed, silence and extend ability reuse; alliance buffs.
- Proposed identity: Area-control shaman: curses clustered opponents, undermines ability-dependent teams.
- Favours: Packed melee/mage teams; bridge/gatehouse.
- Vulnerable to: Spread ranged opponents, cleanse and focus; open field.
- Candidate implementation / existing gap: Current hex splash/weaken fits partly. Candidate bounded area cooldown delay or silence, distinguish from Warcaller.

### Warcaller — Orc

- Reference: [Warcryer / Doomcryer](https://l2valakasreturns.com/en/clases/warcryer.html).
- Our kit: Mace · padded.
- Source identity: Party chants improve offensive and defensive stats, regeneration and melee sustain.
- Proposed identity: Group-wide steady buffer: supports mixed teams, lower individual power.
- Favours: Allies close together; bridge/courtyard.
- Vulnerable to: Isolation, redundant buffs, focus and fast kills; spread open field.
- Candidate implementation / existing gap: Current stance-dependent group chant fits. Keep distinct breadth/duration versus Runesage's concentrated single-target and War Dancer's offensive tempo.

### Scrapbreaker — Dwarf

- Reference: [Bounty Hunter / Fortune Seeker](https://l2valakasreturns.com/en/clases/bounty-hunter.html).
- Our kit: Hammer · plate.
- Source identity: Spoil/extra monster loot and blunt stun attacks, heavy/light armour mastery.
- Proposed identity: Armour-breaker combat adaptation: disrupts guarded targets with blunt impact.
- Favours: Tanks, plate and shields; ruins/gatehouse.
- Vulnerable to: Distant archers, fast casters, slow swings; open field.
- Candidate implementation / existing gap: Current break-guard fits. Original loot identity intentionally replaced; no gathering/materials, no extra coin bonus without economy approval.

### Forgecaller — Dwarf

- Reference: [Warsmith / Maestro](https://l2valakasreturns.com/en/clases/warsmith.html).
- Our kit: Hammer · plate.
- Source identity: Crafting, mechanical golem, siege golem and explosive servitor.
- Proposed identity: Durable construct specialist: delayed mechanical pressure or bounded splash, not free extra roster.
- Favours: Crowded frontline and confined siege-style fights; gatehouse/courtyard.
- Vulnerable to: Kiting, movement disruption and isolated approach; open field.
- Candidate implementation / existing gap: Current construct attack grants guard only. Candidate delayed construct effect rather than crafting or independent actor; no material costs.

## Design rules for next tuning

- Same weapon does not mean same class. Compare the three assassins, three archers, four tanks, three dedicated healers and three main elemental mages on different tactical axes. Strongest hit, fastest attack and safest approach must not coincide in a single class.
- Terrain acts on reach, cover, clearance, legal movement, protection, ally distance and exposure. Preserve pronounced advantages; no requirement that each class wins 50% in every arena. The narrow bridge permits straight ranged shots but constrains melee approach, ruins/gatehouse reduce archer performance and reward close contact. All shields can stop arrows, but distinct tanks provide different utility.
- Avoid hard role quotas, instant kills, resurrection loops, unlimited stuns, unbounded lifesteal and stacked mitigation. Preserve seven actors unless a separate companion-system proposal is approved. No MP, consumable crystals, XP spending, crafting, gathering, or noncoin resources. Summon effects are currently signature actions, not actual extra units. Proposed roles should not be presented as shipped abilities until implemented and verified.
- Source descriptions are not final player-facing copy. Reconcile actual resolver before updating each info card; include a concise tradeoff and best/worst terrain, no guarantees.

## Existing candidate validation and outstanding defects

04f3acf: all seven workflows passed; [website run 45986130801](https://github.com/janisp123/idle_game/actions/runs/45986130801), 163 tests and Chromium 390/1440, including all 31 info dialogs. 6,960 max-only simulated bouts: 5,040 common clone screen + 840 paired role matrix + 1,080 paired dagger matchup tests (all 31 class roster, full S Masterwork, STR141/DEX141/END129, Fighting52, mastery/stance/Teamwork50). [Raw evidence](https://github.com/janisp123/idle_game/pull/200#issuecomment-7216640854). Ranged stack 27/120 overall, open field 14/24, bridge 12/24, ruins 0/24, courtyard 1/24, gatehouse 0/24. Trickblade vs Longshot 2/24 open, 24/24 ruins, 24/24 gatehouse. However Trickblade vs Oathkeeper 24/24 in all three of those terrains; Swiftblade and Nightblade similarly dominate. This is a counterplay failure despite the arrow result. Dagger versus tank needs correction, and tank/healer/support value must be judged by marginal utility in mixed teams, not pure stack win rate alone. Mage stack 77/120, healer 60/120, summoner 49/120, default 51/120. Current results are not proof of a balanced global meta.

Next proposed max-only validation: for each specialization, test symmetric paired seeds across all five terrains, against same-role variants and representative counter teams; use mixed-team substitutions and holdout compositions, test low-HP timing and actual event effects. Require directional strength in appropriate terrain, viable counter and clear weakness. Do not tune early game before approved endgame baseline. Keep actual rewards/costs untouched in identity research. No numerical retuning or class mechanic change made in this research commit.
