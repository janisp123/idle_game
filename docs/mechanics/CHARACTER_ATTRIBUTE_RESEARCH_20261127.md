# Six attributes — Interlude research and design discussion (2026-11-27)

Owner asked to investigate STR, DEX, CON, INT, WIT, MEN after proposing individual fighter growth and specialization-weighted attribute advancement. Baseline main 3cede30eea0070dd5d64b64afbf9cad114165987 (PR #202). Research only; no runtime changes or simulations. Exact formulas, weights and migration not approved.

## Historical reference

- STR: physical attack.
- DEX: physical attack rate, accuracy, evasion, critical chance, movement.
- CON: HP, regeneration, physical impairment resistance (e.g. stun/bleed).
- INT: magic attack and offensive spell effectiveness.
- WIT: casting speed and magic critical chance.
- MEN: magic defence, MP and recovery, resistance to harmful effects. Specific resistance and interruption formulas vary by chronicle/implementation.

Interlude base attributes are principally race/archetype templates, not individually accumulated through combat. Do not import formulas verbatim or assume later LUC/CHA attributes belong to Interlude.

Sources accessed 2026-11-27:
- https://lineage2.gg/guides/base-stats-and-attribute-modifiers/ (transcribed 2004 Prima guide, historical context)
- https://linedia.ru/en/wiki/Base_stats (community reference)
- https://lineage.pmfun.com/list/stat (community stat descriptions)
- https://www.l2-hub.com/guide/stats (Interlude class templates)
- https://l2king.net/en/baza/gajd-harakteristiki (chronicle-specific secondary reference)

## Proposed adaptation — discussion, not implementation

No shared account combat attributes. Individual fighters gain attributes only while actively fighting. CON replaces END conceptually; exact old-save conversion requires design. Each specialization has a different distribution of a comparable growth budget: archers DEX > STR; heavy melee STR > CON; daggers DEX > STR; tanks CON > MEN/STR; damage mages INT > WIT; healers WIT/MEN/INT; supports WIT/MEN; summoners vary by specialization. All six attributes have a use, but no mana added to current cooldown-based system: MEN supports magic defence and resistance; WIT magical action recovery; INT magic damage and healing where appropriate. Keep DEX physical and WIT magical to avoid a universal speed stat. Exact rates, derived combat effects, six-month ceiling, individual identity across class switches, duplicate classes, offline freeze, migration, and goldens require explicit design and testing.

Next: agree attribute meanings, individual progression identity and class growth profiles before implementation. No balance claims; no tests performed.
