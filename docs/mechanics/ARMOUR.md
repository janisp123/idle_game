# Equipment and the smith

Head, Torso, Arms and Legs each equip None, Padded, Leather or Plate. The four slots cover 12%, 33%, 31% and 24% of the fighter respectively. A full Padded suit provides 12% physical reduction, Leather provides 22%, and Plate provides 50%. Mixed suits contribute in proportion to each slot's coverage. Heavier gear reduces mobility and can reduce initiative. The smith's equipment panel shows the equipped build's total weight, mobility, armour, attack and guard.

A fresh character can select any of the five Non-grade Poor weapons. Bow includes a backup dagger in its equipment profile, and Sword & Shield includes a heater shield. The bow switches to its dagger when arrows run out or the bow breaks. Armour is initially empty. Buy a family for a specific slot, then equip or unequip the owned piece for free. Select a weapon or armour slot to edit one item.

## Item grades and quality

Item grade runs from Non-grade to S, independently of arena difficulty. Quality runs from Poor to Common, Fine and Masterwork. In `smith.mjs`, item power is three times the grade index plus a quality bonus of 0, 2, 5 or 9. Weapon power adds raw damage. Each equipped armour piece adds flat guard equal to its power divided by four and rounded up, alongside the family's base protection. A purchase charges the difference between the old and new cumulative prices, and first-time armour adds a 24-coin purchase cost. Neither grade nor quality can go down in an improvement.

Purchases settle prior work at the old frozen build, deduct coins once and start a new duel snapshot. The condition profile defines maximum HP as 24 plus three times power and marks Masterwork unbreakable. Each battle uses these values to initialize its equipment condition. The shop has no condition controls.

## Arena prizes and saves

Completed victories pay 12, 20, 32, 48, 68, 92, 122 or 158 coins from Non-grade through S. A saved cursor tracks the last paid bout, and double deaths and defeats pay zero. The interim resolver repeats 256 seeded bouts per frozen build. Settlement resolves at most a single period, counts repeats arithmetically, and uses the same outcomes in live and offline play. V10 saves record coins, owned gear, equipped armour, and the frozen combat snapshot. Earlier alpha saves reset once with a clear notice.

Source: `site/play/armour.mjs`, `smith.mjs`, `arena-wallet.mjs` and `engine.mjs`.
