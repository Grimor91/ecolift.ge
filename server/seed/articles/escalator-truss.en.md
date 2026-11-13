*Technical article series "The Escalator as an Engineering System": design, kinematics, mechanics, wear and diagnostics. The series is written for engineers, technicians, service engineers and escalator operation experts. Its aim is not just to list components, but to explain how each assembly works, what loads it carries, how it wears and how its condition affects the reliability of the whole machine.*

**Topic:** escalator design and mechanics · **Level:** engineering · **Reading time:** 10–12 minutes

## Introduction. The structure passengers never see

In escalator operation, attention usually goes to the steps, the handrails and the outer cladding. Yet the geometry, stability and service life of the whole machine depend largely on an element hidden beneath the passenger path: the escalator's load-bearing truss.

The truss is a three-dimensional steel structure that forms the structural backbone of the equipment. The guide tracks, drive and tensioning mechanisms, balustrade elements and other assemblies of the specific model are mounted on it or attached to it.

![The truss is hidden under the cladding: only the underside of the escalator is visible](uploads/escalator-2.jpg)

Unlike an ordinary building beam, an escalator truss must not only carry static loads but also keep the required geometric stability of a system with moving masses, rotating mechanisms and repeated operating loads.

Even when the steel structure remains strong enough, a change in geometry can affect the relative position of the guide tracks, steps, comb plates and drive elements.

The truss should therefore be seen at the same time as:

- a load-bearing structure that carries external and internal loads;
- the geometric base on which the mechanical assemblies are installed;
- the element that transfers forces to the building supports;
- a structure exposed to deformation, vibration, corrosion and fatigue damage.

## 1. How the truss is built

A truss is usually made of steel sections and plate elements joined by welding, bolting or a combination of both. The exact layout depends on the manufacturer, the rise, the span length, the position of the supports and the arrangement of the equipment.

The main structural elements are:

1. **Top and bottom chords.** Longitudinal members that form the main load path of the truss. In an idealised truss model the chords carry a large share of the longitudinal forces caused by bending of the whole structure.
2. **Diagonals and verticals.** Web members that transfer forces between the chords. They make the structure work as a whole and influence its stiffness, stability and the distribution of internal forces.
3. **Support nodes and bearing plates.** The areas where reactions are passed to the building structure. Their condition and the actual support arrangement are essential for how the truss works as designed.
4. **Cross members, brackets and mounting elements.** They hold individual mechanisms, guide tracks and equipment components. The local stiffness of these elements affects how accurately the assemblies are positioned.
5. **Joints and node zones.** Welds, splice plates, gusset plates and bolted joints transfer forces between members. Node geometry, workmanship and joint condition influence stress concentration.

Keep in mind that a real structure does not always match the idealised pin-jointed truss. Some members carry bending, torsion and local loads, and plate parts and cladding may contribute to the structure depending on the design model used. The calculation model must therefore match the real structure, not just its appearance.

## 2. What loads the truss carries

A correct analysis separates permanent loads, operating loads, local effects and loads that arise while the mechanisms move.

### 2.1. Self-weight

Permanent loads include the mass of:

- the steel structure;
- the step band and chains;
- the drive and tensioning mechanisms;
- the handrails and balustrade;
- the cladding, landings and installed equipment.

It is important to distinguish the self-weight of the truss from the weight of equipment transferred to it through mountings and support nodes.

### 2.2. Passenger load

The passenger load passes through the steps to the rollers, guide tracks and other parts of the kinematic system, and then to the load-bearing structure. Its distribution depends on the number of passengers, the position of the step band, the guide track layout and how forces are transferred in the particular model.

An engineering calculation must use the normative load model and consider the load combinations required by the applicable rules.

EN 115-1:2017 requires the load-bearing structure to be designed for its self-weight plus a structural design load of 5000 N/m², and limits the calculated deflection relative to the distance between supports. Whether these requirements apply must be checked against the edition of the standard and the local regulations in force for the specific project.

### 2.3. Equipment loads

Forces at the mounting points need separate attention, in particular for:

- the main drive and gearbox;
- the drive and tension sprockets;
- the guide rails;
- the tensioning devices;
- the handrail drive elements.

These effects can be local and uneven. For example, the load from the drive mechanism acts on a limited area of the structure, so what matters is not only the overall strength of the truss but also the strength of the support brackets, welds and mounting points.

### 2.4. Dynamic effects

A running escalator produces periodic and transient loads from the movement of chains and steps, rotating shafts, rollers passing along the tracks, starting and stopping.

Sources of increased dynamic load can include:

- uneven chain movement;
- damaged or worn rollers;
- distorted guide track geometry;
- imbalance of rotating components;
- loosened joints;
- incorrect adjustment of mechanisms.

Vibration on its own does not prove a truss defect. The source of excitation, the path the vibration travels and the response of the structure must be established.

![Escalators in a shopping centre](uploads/escalator-3.jpg)

## 3. Mechanics: bending, forces and stiffness

Consider the truss as a structure resting on two main supports a distance L apart.

A vertical load produces bending. In an idealised truss the top and bottom chords work mainly in compression and tension respectively, or the other way round, depending on the direction of bending and the sign convention. Diagonals and verticals carry the shear forces and keep the structure in equilibrium.

In a real truss the stress distribution depends on:

- the geometry of the web;
- the cross-section and length of individual members;
- the stiffness of the joints;
- the boundary conditions and the actual support arrangement;
- the position of the equipment;
- local deformation of the nodes;
- the three-dimensional behaviour of the structure.

### 3.1. Deflection as a key operating parameter

Deflection is the displacement of a structure from its original position under load.

For a first understanding of the mechanics, a simply supported beam with a uniformly distributed load can be used:

> **δ<sub>max</sub> = 5·q·L⁴ / (384·E·I)**

where:

- δ<sub>max</sub> is the maximum deflection;
- q is the uniformly distributed load per unit length;
- L is the span;
- E is the modulus of elasticity of the material;
- I is the second moment of area of the section.

The formula shows an important relationship: all else being equal, deflection rises sharply as the span grows and falls as bending stiffness increases.

It is not, however, a formula for directly calculating a real escalator truss. That requires taking into account the lattice structure, node loads, three-dimensional behaviour, the actual supports and the requirements of the specific project. Complex structures may need finite element analysis. The use of this approach in escalator truss design is discussed in a technical article by Elevator World.

### 3.2. Why a small deflection can matter a lot

For a load-bearing structure, not only the strength of the steel matters but also keeping the mechanical assemblies in the right position relative to each other. Even without plastic failure, excessive or uneven deformation can change:

- the position and relative geometry of the guide tracks;
- clearances in the moving system;
- the position of the drive and tensioning mechanisms;
- the geometry of the transition sections;
- how the steps mesh with the comb plates.

General deflection of the truss, local deformation of a bracket, displacement of a support and a change in the geometry of a single guide track must be told apart. They have different causes and call for different diagnostic methods.

## 4. Stress, stability and material fatigue

### 4.1. Stress concentration

In an ideal calculation model, forces may be spread fairly evenly across the members. In a real structure, local stresses rise where the geometry changes, at holes, welds and abrupt changes of section.

Special attention is needed at:

- welded joints between diagonals and chords;
- equipment mounting nodes;
- zones where the section changes;
- areas thinned by corrosion;
- places of earlier repair or strengthening.

A local stress concentration does not mean immediate failure, but under cyclic loading such zones can become the starting point of a fatigue crack.

### 4.2. Buckling of compression members

Compression members can buckle before the material reaches its strength limit. The risk depends on the slenderness of the member, its effective length, the end restraints, initial imperfections and load eccentricity.

During inspection, look for permanent deformation, local buckling of section walls, bent members and damaged joints.

Stability cannot be judged by eye alone: the absence of visible bending does not replace an engineering calculation when there is reason to suspect a loss of load-bearing capacity.

### 4.3. Fatigue damage

An escalator works under repeated operating loads. Depending on the duty and the design, some zones of the truss may experience cyclic stresses.

Fatigue damage can develop gradually. A joint may look sound for some time while a crack is already forming in the stress concentration zone. During inspection it is therefore important to consider not only the size of a visible defect but also its location, how it develops over time and how it relates to the acting loads.

## 5. Corrosion and loss of load-bearing capacity

Corrosion is dangerous not only because it spoils the look of the steelwork. Loss of wall thickness reduces the cross-sectional area and can lower strength, stiffness and stability.

Check most carefully the zones where moisture and dirt can collect:

- areas with damaged protective coating;
- the undersides of members;
- joints and hard-to-reach cavities;
- zones exposed to leaks from the building;
- contact points between dissimilar materials, where conditions for corrosion exist.

When corrosion is found, assess not only its area but also its depth, the remaining metal thickness, its location relative to the highest forces and its effect on the joints.

Painting a damaged area without assessing the remaining section is not a full restoration of load-bearing capacity.

![The underside of an escalator clad in metal panels](uploads/escalator-6.jpg)

## 6. Truss diagnostics: the order of an engineering survey

Diagnostics must follow an approved procedure, taking into account the manufacturer's manual, safety requirements and staff authorisation for the work.

1. **Review the documentation.** Study the truss drawings, calculation model, support layout, records of earlier repairs, permitted deformations and results of previous surveys.
2. **Visual inspection.** Check the condition of the chords, diagonals, joints, support nodes, protective coating and equipment mounting zones. Record cracks, corrosion, deformation and signs of joint movement.
3. **Geometry check.** Where there is reason to, take instrument measurements of levels, support positions, deflection and the geometry of critical sections. Compare the results with design data and permitted values.
4. **Check suspicious zones.** If signs of cracks or other damage are found, decide which additional inspection method is needed. Non-destructive testing is done by qualified specialists, taking into account the material, joint type and nature of the defect.
5. **Assess the results and decide.** Compare the results with the applicable criteria and decide whether further survey, engineering calculation, repair or restricted operation is needed.

### 6.1. Measuring deflection

To monitor deformation, the original geometry must be known and the measurement conditions set correctly. Record:

- the position and condition of the supports;
- the measuring points and the reference system used;
- the load state during measurement;
- the temperature, if it can noticeably affect the results;
- the accuracy of the measuring equipment;
- whether current and previous measurements are comparable.

A measured deviation must be interpreted in light of the test conditions. A result obtained under one load arrangement cannot be compared directly with one obtained under another without proper engineering justification.

### 6.2. Telling a truss defect from a defect in a neighbouring assembly

For example, if the step band geometry is found to be out of line, you cannot conclude straight away that the truss has deformed. Other causes are possible:

- worn rollers;
- damaged guide tracks;
- shifted fasteners;
- changed support positions;
- incorrect adjustment;
- local deformation of a bracket.

Correct diagnostics must establish the cause-and-effect link between the deviation found and its source.

## 7. Typical defects and their possible causes

| Symptom | Possible causes | What to check |
|---|---|---|
| Change in structural geometry | Support movement, member deformation, changed restraint conditions | Supports, reference marks, design geometry |
| Crack in a weld | Fatigue, stress concentration, joint defect, overload | Nature of the crack, the node, the load arrangement |
| Corrosion damage | Moisture, damaged coating, aggressive environment | Remaining thickness, corrosion depth, joint condition |
| Local bending of a member | Overload, impact, buckling, installation damage | Geometry, cross-section, restraint conditions |
| Increased structural vibration | Excitation from the drive, chains, rollers or loose joints | Vibration source, frequency characteristics, fixings |
| Displacement at a support | Changed bearing conditions, damaged support node, movement of the building structure | Bearing surfaces, truss position, project documents |

This table is a list of diagnostic hypotheses, not a one-to-one "symptom equals fault" map. Measurements and supporting data are needed to establish the cause.

## 8. Standards and their limits

When surveying and assessing a truss, you must determine which standards apply to the specific escalator. Depending on the country, date of manufacture, purpose and modernisation history, different editions of design and safety requirements may apply.

In particular, EN 115-1 sets requirements for the design and installation of new escalators and moving walks within its scope. The publication of a newer edition does not automatically make all of its requirements apply to equipment installed earlier.

An engineering assessment should use:

- the manufacturer's technical documentation;
- the applicable building codes and safety standards;
- the design calculations for the specific installation;
- the defect and repair assessment criteria set in the project;
- the results of instrument measurements and surveys.

Do not apply universal numerical tolerances without checking that they apply. For example, a deflection limit permitted for a particular load model under a particular standard is not automatically a rejection criterion for every escalator truss.

![Escalators in a shopping centre: the truss sits behind the balustrade and cladding](uploads/escalator-4.jpg)

## 9. Repair and restoration

When defects are found, first determine their cause and assess their effect on the load-bearing capacity and geometry of the equipment.

Repair may include restoring the protective coating, replacing damaged members, restoring joints or strengthening the structure, but only after the chosen solution has been technically justified.

Before welding, drilling, strengthening or changing mountings, take into account:

- the original calculation model;
- changes in stiffness and redistribution of forces;
- the effect of heat on the material and neighbouring members;
- the possibility of residual deformation;
- the need to re-check the geometry;
- the requirements of the manufacturer and applicable standards.

Strengthening the structure on your own initiative with extra plates or welded parts can change the stress distribution and create new stress concentrations. Structural changes must therefore be agreed and backed by an engineering decision.

Work inside the truss is carried out only after the equipment has been safely taken out of service by the prescribed procedure, energy sources have been isolated and the work area has been confirmed safe.

## 10. Practical conclusion

An escalator truss is not just a steel frame that holds the equipment. It is a load-bearing system on which the strength, stiffness and geometric stability of the whole machine depend.

For a maintenance specialist, the key task is not only to find visible defects but to understand their mechanical nature. A shifted support, local deformation of a bracket, a fatigue crack and general deflection can look alike from the outside, yet each calls for a completely different method of assessment.

Reliable diagnostics rest on three things: knowledge of the design, objective measurements and comparison of the results with the design criteria.

> **The key engineering principle:** assess the truss for strength, stability, stiffness, geometry and joint condition all at once. Only this approach gives a sound judgement of the technical condition of the load-bearing structure.

![Escalators in a shopping centre atrium](uploads/escalator-5.jpg)

## Sources and further reading

- [EN 115-1:2017 — Safety of escalators and moving walks, Part 1: Construction and installation](https://www.nen.nl/en/nen-en-115-1-2017-en-236358): scope and design requirements.
- [Elevator World — Escalator Truss Design](https://elevatorworld.com/article/escalator-truss-design/): an engineering example of truss analysis using the finite element method.

## Series plan

**Part I. Load-bearing structure and kinematic layout**

1. The escalator truss: load-bearing system, loads, stiffness, deformation and geometry control.
2. Steps: tread, riser, axles, brackets, roller supports and kinematics of the step band.
3. Step chains: links, pins, bushings, joints, tension, elongation and fatigue wear.
4. Guide rails and rollers: paths of motion, contact mechanics, load distribution and dynamic effects.

**Part II. Drive and power transmission**

5. Main drive: motor, gearbox, couplings, shafts and drive sprockets.
6. Brake system: braking torque, stopping, holding and checking brake performance.
7. Handrail and handrail drive: traction mechanism, guides, tension, synchronisation and slip.
8. Tension station and return section: tension carriage, compensating movement, chain turnaround and kinematics of the return run.

**Part III. Passenger area and safety**

9. Balustrade, skirt panels and guards: design, clearances, stiffness and passenger protection.
10. Comb plates and transition zones: how steps meet the landings, tooth geometry and devices that detect hazardous entrapment.
11. Safety system: emergency stops, monitoring of speed, chains, handrail and other protective devices.

**Part IV. Electrics, diagnostics and reliability**

12. Electric drive and control system: controller, frequency inverter, sensors and operating logic.
13. Lubrication, maintenance and mechanical wear: tribology, contamination, material fatigue and preventive inspections.
14. Fault diagnosis and condition assessment: vibration, noise, temperature, measurements, root cause analysis and documenting the results.

*Next in the series: "Escalator steps: design, kinematics, contact loads and wear mechanisms".*
