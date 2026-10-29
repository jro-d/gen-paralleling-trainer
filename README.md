# Generator Paralleling Trainer (4 × DG)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Standard: IEC 60092](https://img.shields.io/badge/Marine%20Standard-IEC%2060092-orange.svg)]()
[![HMI: ISA--101](https://img.shields.io/badge/HMI-ISA--101%20High%20Performance-lightgrey.svg)]()
[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla%20JS%2FSVG)-green.svg)]()

> **A standalone marine power system trainer for paralleling up to 4 diesel generators with synchroscope, governor/AVR control, split-bus bus tie, and ISA-101 industrial HMI.**

---

## ⚡ Overview

The **Generator Paralleling Trainer** is a zero-dependency, browser-based electrical engineering simulator designed for marine engineering students, Electro-Technical Officers (ETO), and electrical power systems trainees.

It simulates a full commercial vessel **Main Switchboard (MSB)** featuring:
* **4 × Medium-Speed Diesel Generators (DG 1 to DG 4)**
* **Dual-Section Main Switchboard**:
  * **Bus Section A (Port)**: DG 1 & DG 2 Incomers
  * **Bus Section B (Starboard)**: DG 3 & DG 4 Incomers
* **Bus Tie Breaker (BT-1 / ANSI 52BT)** with check-sync interlock for tied-bus vs. split-bus redundant operation
* **Full Marine Synchroscope & 3-Lamp Dark/Bright System**
* **Active & Reactive Load Sharing** (Governor Speed Droop & AVR Voltage Droop)
* **Reverse Power Protection (ANSI 32R)** with 10-second countdown and breaker trip
* **Draggable Floating Interactive Student Guide** for hands-on, concurrent tutorial training

---

## 🚀 Live Demo & Offline Usage

* **Live Web App**: [https://jro-d.github.io/gen-paralleling-trainer/](https://jro-d.github.io/gen-paralleling-trainer/)
* **100% Offline Standalone File**: Download [`Generator-Paralleling-Trainer-Standalone.html`](Generator-Paralleling-Trainer-Standalone.html) and double-click to launch in any browser. It contains zero external network dependencies, fonts, CDNs, or scripts, making it fully operational in air-gapped vessel computer rooms or offline maritime classrooms.
* **Local Source**: You can also open [`index.html`](index.html) or [`gen-paralleling-trainer.html`](gen-paralleling-trainer.html) directly. No build steps, web server, or Node.js required.

---

## 🚢 Key Features

### 1. Detailed Marine Diesel Generator Engineering
* **Foundation & Bedplate**: Resilient anti-vibration coil spring and rubber damping mounts, wet lube oil sump pan with level sight glass.
* **Crankcase & Heads**: Ribbed cast iron crankcase doors with spring-loaded **Bicera explosion relief valves**, individual cylinder heads with decompression cocks, and SOLAS-compliant double-walled sheathed fuel injection lines.
* **Turbocharging**: Free-end exhaust gas turbine with thermal lagging blanket, intake air silencer drum, and charge air intercooler.
* **Brushless Alternator**: Salient 4-pole rotating field rotor, cooling air ventilation louvers, high-voltage terminal box (6.6 kV), and non-drive end brushless exciter.
* **Real-Time Animations**: Moving pistons in firing order sequence, spinning turbocharger compressor, rotating alternator field, and dynamic exhaust smoke density that deepens under active electrical load.

### 2. Authentic Drawout Breaker Cubicles (VCB)
* Withdrawable Vacuum Circuit Breaker (VCB) truck cradle on guide rails (`RACKED IN`).
* Upper and lower isolating disconnect bushing contacts (tulip clusters).
* Measuring transformers: 3× Current Transformers (CT 400/1A) and Potential Transformer (PT / VT).
* Earth Switch (`ES OPEN / EARTHED`).
* Multi-function digital protection relay bezel displaying active ANSI codes:
  * `[ANSI 25]` Check-Synchronising
  * `[ANSI 32R]` Reverse Power Protection
  * `[ANSI 50/51]` Overcurrent
  * `[ANSI 27/59]` Under/Over Voltage

### 3. Dual Switchboard Sections & Bus Tie (BT-1)
* **Tied-Bus Mode**: Section A and Section B connected into a unified 6.6 kV / 60 Hz bus. Load demand is distributed across all connected generators.
* **Split-Bus Mode (Isolated Sections)**: Bus Tie BT-1 opened to isolate Port and Starboard switchboards (standard offshore DP / redundant propulsion mode).
* **Bus Tie Synchro-Check**: Closing BT-1 between two live sections requires checking that frequency and voltage match ($\Delta f \le 0.25\text{ Hz}$, $\Delta V \le 5\%$).

### 4. Floating, Non-Modal Interactive Student Tutorial
* **Draggable Header**: Click and drag anywhere on screen so it never obstructs whatever generator or gauge you are operating.
* **Multi-Tab Curriculum**:
  * *Phase 1*: Black Start & Dead Bus Closing
  * *Phase 2*: Incoming Generator Pre-checks (Δf and ΔV trimming)
  * *Phase 3*: Synchroscope Observation & Check-Sync Breaker Closing
  * *Phase 4*: Active kW & Reactive kVAr Load Sharing
  * *Phase 5*: Reverse Power Alarm (ANSI 32R)
  * *Phase 6*: Split-Bus & Bus Tie Synchronization
* **Minimize & Width Toggles**: Collapse to a slim floating pill or expand to full width.

---

## 📐 Mathematical Model & Origin

This simulation logic was reconstructed via reverse engineering (**REA - Reverse Engineer Anything**) from the classic simulation *Generator_Synchronisation v7.1* (S. Zaitschenko 2014) and scaled to modern marine medium-voltage specifications:

* **Frequency & Governor Droop**:
  $$f = f_{\text{nom}} \left( 1 + 0.10 \cdot \frac{P_{\text{fuel}} - P_{\text{use}} - P_{\text{demand}}}{P_{\text{rated}}} \right)$$
* **Terminal Voltage & Excitation**:
  $$V = V_{\text{nom}} \left( 1 + 0.18 \cdot \frac{Q_{\text{field}} - Q_{\text{use}} - Q_{\text{demand}}}{Q_{\text{rated}}} \right)$$
* **Check-Sync Breaker Permissive Window**:
  * $|\Delta f| \le \pm 2.0\%$ ($\pm 1.20\text{ Hz}$ at 60 Hz)
  * $|\Delta V| \le \pm 4.8\%$ ($\pm 318\text{ V}$ at 6.6 kV)
  * Auto-close relay at $|\Delta \theta| \le \pm 2.0^\circ$ (top dead center / 12 o'clock)
* **Reverse Power Protection (ANSI 32R)**:
  * Trigger: $P_{\text{out}} < -4\%\text{ of rating}$ (motoring state)
  * Timer: 10.0-second continuous countdown before emergency GCB trip and prime mover shutdown.

For complete bytecode disassembly and verification logs, see [`REA-FINDINGS.md`](REA-FINDINGS.md).

---

## 🛠️ Plant Profiles

The trainer includes one-click plant profile switching in the top bar:
* **Marine 6.6 kV** (Default): 4 × 3,500 kW / 60 Hz / 6,600 V Diesel Generators.
* **Original 415 V**: 4 × 500 kW / 50 Hz / 415 V Low Voltage Generators.
* **Slip Multipliers**: $\times 1$ (Original Flash rate), $\times 20$ (Training mode), $\times 75$ (Realistic slip rate).

---

## 📜 License

Distributed under the MIT License. Developed as part of open educational resources for marine electrical engineering.
