// Headless checks of the trainer's model against hand-derived values from the AS3 bytecode.
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../gen-paralleling-trainer.html', import.meta.url), 'utf8');
const src = /<script id="sim-model">([\s\S]*?)<\/script>/.exec(html)[1];
const Sim = new Function(src + '\nreturn Sim;')();

let fails = 0;
const near = (a, b, tol, msg) => { const ok = Math.abs(a - b) <= tol; if (!ok) fails++; console.log((ok ? 'PASS' : 'FAIL') + '  ' + msg + '  got ' + a.toFixed(3) + ' want ' + b); };
const is = (c, msg) => { if (!c) fails++; console.log((c ? 'PASS' : 'FAIL') + '  ' + msg); };
const run = (s, sec) => { for (let k = 0; k < sec * 24; k++) Sim.tick(s, Sim.TICK); };

// --- 1. Single unit, original 415 V profile ---------------------------------
let s = Sim.create('flash', 'train', { rand: () => 0.25 });
Sim.start(s, 0);
near(s.gens[0].hz, 50, 1e-9, 'DG1 start: 50 Hz');
near(s.gens[0].volts, 415, 1e-9, 'DG1 start: 415 V');
is(Sim.closeCB(s, 0).closed, 'dead-bus close accepted');
Sim.setDemand(s, 200);
near(s.gens[0].hz, 48, 1e-9, 'fuel 10 %, D=200 kW: 48 Hz (underspeed)');
Sim.setFuel(s, 0, 50);
near(s.gens[0].hz, 50, 1e-9, 'fuel 50 %: 50 Hz'); near(s.gens[0].outKW, 200, 1e-9, 'out 200 kW');
Sim.toggleAuto(s, 0);
near(s.gens[0].fuel, 50, 1e-9, 'auto fuel = reqFuel(200) = 50 %');
near(s.gens[0].field, 86.667, 1e-3, 'auto field = reqField(100 kVAr)');
near(s.gens[0].volts, 415, 1e-9, 'auto voltage 415 V');

// --- 2. Paralleling DG2 ------------------------------------------------------
Sim.start(s, 1);
near(s.gens[1].hz, 50, 1e-9, 'DG2 at nominal');
Sim.setFuel(s, 1, 12);
near(s.gens[1].hz, 50.1, 1e-9, 'DG2 fuel 12 % → 50.1 Hz');
is(Sim.closeCB(s, 1).ok, 'DG2 arm accepted'); is(s.gens[1].state === Sim.STATE.ARMED, 'DG2 armed');
run(s, 120);
is(s.gens[1].state === Sim.STATE.MANUAL, 'DG2 closed by sync relay');
near(s.gens[0].outKW, 190, 1e-6, 'DG1(auto) takes D − (f2−use) = 190');
near(s.gens[1].outKW, 10, 1e-6, 'DG2(manual) out = f2 − use = 10');
near(s.totalOut, 200, 1e-6, 'sum = demand');
near(s.bus.hz, 50, 1e-6, 'bus 50 Hz');

// --- 3. Reverse power trip -----------------------------------------------------
Sim.setFuel(s, 1, 0);
near(s.gens[1].outKW, -50 + 0, 1e-6, 'fuel 0 → −use = −50 kW');
run(s, 9); is(s.gens[1].state === Sim.STATE.MANUAL && s.gens[1].rpActive, 'still on after 9 s, alarm active');
run(s, 2); is(s.gens[1].state === Sim.STATE.STOPPED && s.gens[1].rpTripped, 'tripped after 10 s');

// --- 4. Overload droop ---------------------------------------------------------
Sim.setDemand(s, 1000);
near(s.gens[0].fuel, 100, 1e-9, 'auto fuel saturates at 100 %');
near(s.gens[0].hz, 44.5, 1e-6, 'overload: 50·(1 + 0.1·(500−50−1000)/500) = 44.5 Hz');
near(s.unservedKW, 550, 1e-6, 'unserved 550 kW');

// --- 5. Four units, all auto share equally --------------------------------------
s = Sim.create('marine', 'real', { rand: () => 0 });
Sim.start(s, 0); Sim.closeCB(s, 0); Sim.toggleAuto(s, 0); Sim.setDemand(s, 0);
for (const i of [1, 2, 3]) {
  Sim.start(s, i);
  const g = s.gens[i];
  // nudge speed slightly fast then wait for relay
  Sim.setFuel(s, i, 11);
  is(Sim.closeCB(s, i).ok, 'DG' + (i + 1) + ' arm accepted');
  run(s, 60);
  is(g.state === Sim.STATE.MANUAL, 'DG' + (i + 1) + ' closed');
  Sim.toggleAuto(s, i);
}
Sim.setDemand(s, 4000);
for (const g of s.gens) near(g.outKW, 1000, 1e-6, g.name + ' shares 1000 kW');
near(s.bus.hz, 60, 1e-6, 'bus 60 Hz');

// --- 6. Inhibits -----------------------------------------------------------------
s = Sim.create('flash', 'train', { rand: () => 0.1 });
Sim.start(s, 0); Sim.setFuel(s, 0, 40);   // 50 + .01*(200−50) = 51.5 Hz
const r = Sim.closeCB(s, 0);
is(!r.ok && /frequency/.test(r.reason), 'close inhibited out of frequency window: ' + r.reason);
Sim.setFuel(s, 0, 10); Sim.setField(s, 0, 150);  // 225 kVAr → V = 415 + .25*(225−30)= 463.75
is(!Sim.closeCB(s, 0).ok, 'close inhibited out of voltage window');
// Overspeed after opening breaker while carrying load
s = Sim.create('flash', 'train'); Sim.start(s, 0); Sim.closeCB(s, 0); Sim.setDemand(s, 300); Sim.setFuel(s, 0, 70);
Sim.openCB(s, 0);
near(s.gens[0].hz, 50 + 0.01 * (350 - 50), 1e-9, 'opening CB at 70 % fuel → overspeed 53 Hz');
console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASSED');
process.exit(fails ? 1 : 0);
