# Generator Paralleling Trainer (4 × DG)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Standard: IEC 60092 / 60617](https://img.shields.io/badge/Marine%20Standard-IEC%2060092%20%7C%2060617-orange.svg)]()
[![STCW: Section A--III/1 & A--III/6](https://img.shields.io/badge/STCW-Competency%20Drills-blueviolet.svg)]()
[![HMI: ISA--101](https://img.shields.io/badge/HMI-ISA--101%20High%20Performance-lightgrey.svg)]()
[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla%20JS%2FSVG)-green.svg)]()

> **A comprehensive, zero-dependency marine power system simulator for paralleling up to 4 diesel generators with synchroscope, Power Management System (PMS), heavy motor inrush dynamics, procedural audio engine, IEC 60617 Single-Line Diagram, and STCW automated competency examination.**

---

## ⚡ Overview

The **Generator Paralleling Trainer** is an open-source, browser-based electrical engineering simulator designed for marine engineering students, Electro-Technical Officers (ETO), and electrical power plant trainees.

It simulates a commercial vessel **Main Switchboard (MSB)** featuring:
* **4 × Medium-Speed Marine Diesel Generators (DG 1 to DG 4)**
* **Dual-Section Main Switchboard**:
  * **Bus Section A (Port MSB)**: DG 1 & DG 2 Incomers
  * **Bus Section B (Starboard MSB)**: DG 3 & DG 4 Incomers
* **Bus Tie Breaker (BT-1 / ANSI 52BT)** with check-sync interlock for tied-bus vs. split-bus redundant operation
* **Full Marine Synchroscope & 3-Lamp Dark/Bright System**
* **Marine Power Management System (PMS / IAS Automation)**
* **Heavy Consumer Direct-On-Line Motor Inrush Dynamics** (1,500 kW Bow Thruster & 800 kW Ballast Pump)
* **Procedural Web Audio Engine** (Synthesized diesel engine rumble, load torque growl, VCB breaker clacks, and maritime alarms)
* **IEC 60617 Single-Line Diagram (SLD) View** with live active/reactive power flow vectors and interactive breakers
* **Simulated Fault Injection Drills** (Governor hunting, AVR loss of excitation ANSI 40, cylinder misfire derate, breaker mechanism jam, and 2-stage preferential tripping)
* **STCW Practical Examination & Automated Competency Grading** with printable Certificate of Competency

---

## 🚀 Live Demo & Offline Usage

* **🌐 Live Web App**: [https://jro-d.github.io/gen-paralleling-trainer/](https://jro-d.github.io/gen-paralleling-trainer/)
* **💾 100% Offline Standalone File**: Download [`Generator-Paralleling-Trainer-Standalone.html`](Generator-Paralleling-Trainer-Standalone.html) and double-click to launch in any browser. It contains zero external network requests, fonts, CDNs, or scripts, making it fully operational in air-gapped vessel computer stations or offline maritime simulation labs.
* **📂 Local Source**: Open [`index.html`](index.html) or [`gen-paralleling-trainer.html`](gen-paralleling-trainer.html) directly. No build tools, web server, or Node.js required.

---

## 🚢 Advanced Capabilities & Systems

### 1. 🔊 Procedural Web Audio Engine (Zero Media Files)
Using the browser's native `AudioContext`, the simulator synthesizes real-time sound with zero external MP3/WAV downloads:
* **RPM-Tracking Diesel Thrum**: Fundamental frequencies track engine electrical frequency (60 Hz nominal).
* **Load Torque Growl**: Harmonic filters open dynamically as active kW increases from 0% to 100%.
* **VCB Mechanical Contact Sounds**: Heavy solenoid thud and high-frequency vacuum contact snap on breaker close and trip.
* **Acoustic Warning Systems**: ANSI 32R reverse power buzzer, two-tone crystalline synchro-check chime, and deep nautical klaxon horn for preferential tripping.

### 2. ⚡ Marine Power Management System (PMS / IAS Automation)
Click **[PMS: OFF]** in the top bar to engage automated vessel power management:
* **Load-Dependent Auto-Start**: When bus load exceeds 80% for > 3 s, the PMS automatically starts the standby unit, trims speed and excitation, arms check-sync, closes the breaker, and balances active & reactive power 50/50.
* **Low-Load De-paralleling**: When total demand drops below 35% with multiple units online for > 7 s, PMS ramps the lagging generator down to < 25 kW, opens the GCB cleanly (bumpless disconnect), runs a 3-second cool-down, and stops the prime mover.
* **Blackout Auto-Recovery**: Automatically initiates emergency black-start on DG 1 onto the dead bus if power collapses.

### 3. 📉 Heavy Consumer Direct-On-Line Motor Inrush Dynamics
* Direct-On-Line (DOL) 3-phase induction motors (like the **1,500 kW Bow Thruster** and **800 kW Ballast Pump**) draw **4.5× to 6.0× starting inrush current** for the first 2.5 seconds.
* **The Maneuvering Rule**: Starting heavy consumers on a single generator causes severe transient voltage and frequency dips (< 45 Hz), immediately triggering overload or blackout. Students learn why sufficient spinning reserve must be paralleled prior to harbor maneuvering.

### 4. 🔲 Dual View: Switchboard Bays vs. IEC 60617 Single-Line Diagram
* **Bay View**: Authentic physical engine models with moving pistons, spinning turbocharger, spring vibration dampers, Bicera relief valves, and drawout Vacuum Circuit Breaker cradles.
* **IEC 60617 SLD View**: High-contrast marine electrical schematic displaying generators, Neutral Earthing Resistors (NGR), Current Transformers (CT), Potential Transformers (PT), and live animated red power flow chevrons (`>>>`). Circuit breakers can be operated by clicking directly on the SLD.

### 5. 🚨 Fault Injection & Emergency Response Drills
Access the **[Faults]** popover to test troubleshooting responses:
* **Governor Hunting**: Sticky fuel rack causing ±1.4 Hz speed oscillations.
* **Loss of Excitation (ANSI 40)**: AVR diode failure causing terminal voltage collapse to 50% and heavy reactive power absorption.
* **Cylinder Misfire / Derate**: 40% mechanical derating with thick black exhaust smoke.
* **Breaker Mechanism Jam**: Breaker fails to close mechanically when synchroscope aligns.
* **Preferential Tripping (Non-Essential Shedding)**: 110% overload triggers Stage 1 (Galley/HVAC shed, -20%) at 4 s and Stage 2 (Deck machinery shed, -30%) at 8 s with klaxon horn.

### 6. 🏆 STCW Automated Examination & Competency Certificate
The **Exam & Challenges** tab features structured maritime assessments:
1. **Cold Ship Black-Start & Load Pickup** (60 s limit)
2. **Precision Manual Paralleling (DG 1 & DG 2)** (90 s limit)
3. **Bumpless Generator De-paralleling & Isolation** (45 s limit)
4. **Heavy Consumer Maneuvering Preparation** (75 s limit)
5. **Split-Bus Re-synchronization (Bus Tie BT-1)** (60 s limit)

Tracks frequency stability, peak $\Delta f$, voltage dips, and reverse power alarms to calculate an STCW-standard score (0–100) and letter grade (**S, A, B, C, F**). Passing unlocks a printable **Certificate of Maritime Technical Competency**.

---

## 📐 Mathematical Model & Origin

Simulation logic reverse-engineered (**REA**) from *Generator_Synchronisation v7.1* (S. Zaitschenko 2014) and scaled to marine medium-voltage specifications:

* **Governor Droop**:
  $$f = f_{\text{nom}} \left( 1 + 0.10 \cdot \frac{P_{\text{fuel}} - P_{\text{use}} - P_{\text{demand}}}{P_{\text{rated}}} \right)$$
* **AVR Voltage Excitation**:
  $$V = V_{\text{nom}} \left( 1 + 0.18 \cdot \frac{Q_{\text{field}} - Q_{\text{use}} - Q_{\text{demand}}}{Q_{\text{rated}}} \right)$$
* **Check-Sync Breaker Permissive Window**:
  * $|\Delta f| \le \pm 2.0\%$ ($\pm 1.20\text{ Hz}$ at 60 Hz)
  * $|\Delta V| \le \pm 4.8\%$ ($\pm 318\text{ V}$ at 6.6 kV)
  * Auto-close relay at $|\Delta \theta| \le \pm 2.0^\circ$ (top dead center / 12 o'clock)
* **Reverse Power Protection (ANSI 32R)**:
  * Trigger: $P_{\text{out}} < -4\%\text{ of rating}$ (motoring state)
  * Timer: 10.0-second continuous countdown before GCB trip and prime mover shutdown.

For full bytecode disassembly and extraction records, see [`REA-FINDINGS.md`](REA-FINDINGS.md).

---

## 🛠️ Plant Profiles

Switchable via the top bar:
* **Marine 6.6 kV** (Default): 4 × 3,500 kW / 60 Hz / 6,600 V Diesel Generators.
* **Original 415 V**: 4 × 500 kW / 50 Hz / 415 V Low Voltage Generators.
* **Slip Multipliers**: $\times 1$ (Original Flash rate), $\times 20$ (Training mode), $\times 75$ (Realistic slip rate).

---

## 📜 License

Distributed under the MIT License. Developed as an open educational resource for maritime electrical engineering.
