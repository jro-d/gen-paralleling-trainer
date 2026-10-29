# Generator Synchronisation – extracted model (v7.1, S. Zaitschenko 2014)

Source: `Generator_Synchronisation-Original.exe` (Flash projector, x86 PE, 8 990 380 B, sha256 `2a8e476c…759cc3`).

## How it was extracted

| Step | Tool | Result |
|---|---|---|
| 1. Identify target | REA `open_binary` | PE / executable / x86. Native deep providers (Ghidra, Hopper) are **unavailable** for this target (x86 PE on Windows, no Java / `GHIDRA_INSTALL_DIR`), so REA could not decompile the projector stub. |
| 2. Locate payload | `tools/swf-extract.mjs` | Projector trailer `56 34 12 FA` + size → embedded **SWF v15, `CWS` (zlib), 118 004 B → 221 130 B**, 24 fps, 1 frame, 1 `DoABC` tag (**ActionScript 3**). |
| 3. Disassemble AS3 | `tools/abc-dump.mjs` (own ABC parser) | Main class `Generator_Synchronisation_v7_1` – 63 methods, 5 435 lines of bytecode in `extracted/main_class.txt`. |

Everything below is **observed in bytecode** unless tagged *(inferred)*.

## Constants (class slot defaults)

| Name | Value | Meaning |
|---|---|---|
| `genMaxKW` | 50 | rating in "units" – 1 unit = 10 kW on the meters (`kW = outputKW × 10`) → **500 kW** |
| `genMaxKVAr` | 30 | → **300 kVAr** |
| `genUseKW` / `genUseKVAr` | 5 / 3 | fixed self-consumption offset (10 % of rating) |
| `minFuel` / `minField` | 10 / 20 | values set on Start (fuel 10 % → exactly the offset → 50 Hz) |
| `genDeltaF` | 2 | close permissive: `rotorspeed` within 100 ± 2 → **±1 Hz** (speed = 2 × Hz) |
| `genDeltaV` | 20 | close permissive: 415 ± 20 V |
| `genDeltaAngle` | 2 | sync relay closes when folded angle ≤ **2°** |
| `REVERSEPOWERTRIGGER` | −2 | outputKW < −2 units (**−20 kW**) |
| Reverse-power timer | 10 000 ms | `Timer(10000)`; start while condition true, stop/reset when false; on expiry `tripReversePower` |
| `loadPF` | 0.5 | `demandLoadKVAr = demandLoadKW × 0.5` |
| Frame loop | `ENTER_FRAME → mainRoutine` | 24 fps |

## States (`gen[i].state`)

`0` stopped · `1` running, CB open · `2` sync armed · `3` loaded, manual · `4` loaded, auto

## Controls

* **Start** (only from 0): state 1, `field = 20`, `fuel = 10`, reverse-power lamp cleared.
* **Stop**: state 0, breaker open, Man.
* **Close CB** (`onCloseCBClick`): `checkGenOutput` sets `closeCBOK` = speed∈100±2 **and** volts∈415±20. If **not** OK the click is ignored. If the other unit is stopped (key `1`) → close immediately (dead bus, state 3). If the other unit is running/loaded (keys 11/31/41) → state 2, `reqSynchronisation = true`.
* **Sync relay** (`checkSynchronisation`, every frame): `Δ = |angle1 − angle2|`, `if Δ > 180 → Δ = 360 − Δ`; if `Δ ≤ genDeltaAngle` → state 3, loaded, sync lamp off. Synchroscope pointer = `angle2 − angle1` (or reverse for gen 2).
* **Open CB**: sync-armed or loaded → state 1 (running, unloaded). Fuel / field keep their positions.
* **Auto**: toggles 3 ↔ 4 (only valid while loaded; otherwise `trace("wrong state")`).

## Physics

```text
fuelKW   = min(fuel  × maxKW  / 100, maxKW)
fieldKVAr= min(field × maxKVAr/ 200, maxKVAr)
reqFuel(x)  = clamp((x + useKW ) × 100 / maxKW , 0, 100)
reqField(x) = clamp((x + useKVAr) × 200 / maxKVAr, 0, 200)

rotorspeed = min(130, 100 + 0.2 × (fuelKW  − useKW  − demandKW ))   Hz = rotorspeed / 2
volts      = min(480, int(415 + 2.5 × (fieldKVAr − useKVAr − demandKVAr)))
rotorangle -= rotorspeed / 10      (per frame, wraps at 0 → +360)
```

Per frame, every running unit starts with `demand = 0`, `output = 0` (so an unloaded unit shows `50 + 0.1 × (fuelKW − 5)` Hz and overspeeds if it keeps its load-carrying fuel after Open CB).

Load sharing (loaded units, `D` = demand):

| Loaded units | Rule |
|---|---|
| 1, manual | `out = max(min(fuelKW − use, D), 0)`, demand = D |
| 1, auto | `fuel = reqFuel(D)`, `field = reqField(Q)`, then as above |
| 2, manual+manual | `diff = fuelKW1 − fuelKW2`; `out1 = (D + diff)/2`, `out2 = (D − diff)/2` (no clamp → can go negative = reverse power) |
| 2, one auto | auto unit: `fuel = max(reqFuel(D − (fuelKW_man − use)), minFuel)` (same for field); then diff rule above |
| 2, auto+auto | each: `fuel = reqFuel(D/2)`, `out = max(min(fuelKW − use, D/2), 0)` |

kVAr is shared identically using `fieldKVAr`.

Meters: Hz 48–52 · V 0–500 · kW 0–500 (`angle = kW×240/500 − 120`, floor −130°) · kVAr 0–250 · cos φ centre-zero.

## Generalisation to four units *(inferred – not in the original)*

* `n ≥ 2` loaded: `out_i = D/n + (fuelKW_i − mean(fuelKW))`; autos solve for `(D − Σ manual out)/|A|`; all-auto → `D/n` each. For `n = 2` this reduces exactly to the original rules.
* Bus frequency / voltage: the common per-unit value of the loaded set (identical by construction in the original).
* Synchronising reference: the live bus. (Original referenced "the other generator's rotor".)
* Permissive window is measured against the live bus (original: against nominal).
* Dead-bus closing allowed whenever **no** unit is loaded (original: only if the other unit is stopped).
* Sync relay re-checks Δf and ΔV at the instant of closing.
* Slip time-scale: original relative angle rate = **4.8 °/s per Hz** (very slow). The trainer exposes ×1 (original) / ×20 (training) / ×75 (realistic).
