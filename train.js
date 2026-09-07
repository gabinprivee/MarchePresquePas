const fs = require('fs');
const path = require('path');
const CANNON = require('cannon');

const STATE_PATH = path.join(__dirname, 'state.json');

const POP = 8;
const IN = 12, HID = 10, OUT = 13;
const GLEN = IN * HID + HID + HID * OUT + OUT;
const HZ = 60;
const GEN_SECONDS = 9;
const GEN_STEPS = HZ * GEN_SECONDS;
const GENERATIONS_PER_RUN = 6;
const HISTORY_LIMIT = 20000;

function randGenome() {
  var g = [];
  for (var i = 0; i < GLEN; i++) g.push((Math.random() * 2 - 1) * 0.6);
  return g;
}
function mutate(g) {
  return g.map(function (v) { return Math.random() < 0.2 ? v + (Math.random() * 2 - 1) * 0.5 : v; });
}
function crossover(a, b) {
  var c = [];
  for (var i = 0; i < a.length; i++) c.push(Math.random() < 0.5 ? a[i] : b[i]);
  return c;
}
function forward(genome, inputs) {
  var hid = [];
  for (var h = 0; h < HID; h++) {
    var s = genome[IN * HID + h];
    for (var i = 0; i < IN; i++) s += inputs[i] * genome[i * HID + h];
    hid.push(Math.tanh(s));
  }
  var base = IN * HID + HID, out = [];
  for (var o = 0; o < OUT; o++) {
    var s = genome[base + HID * OUT + o];
    for (var h = 0; h < HID; h++) s += hid[h] * genome[base + h * OUT + o];
    out.push(Math.tanh(s));
  }
  return out;
}
function zAngle(q) { return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z)); }
function relAngle(bodyA, bodyB) {
  var d = zAngle(bodyB.quaternion) - zAngle(bodyA.quaternion);
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
function limitedMotor(hinge, bodyA, bodyB, min, max, speed) {
  var ang = relAngle(bodyA, bodyB);
  if (ang <= min && speed < 0) speed = 0;
  if (ang >= max && speed > 0) speed = 0;
  hinge.setMotorSpeed(speed);
}

function box(hx, hy, hz, mass, pos, filter) {
  var body = new CANNON.Body({ mass: mass, shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)) });
  body.position.set(pos.x, pos.y, pos.z);
  Object.assign(body, filter);
  return body;
}
function hinge(bodyA, pivotA, bodyB, pivotB, maxForce) {
  var h = new CANNON.HingeConstraint(bodyA, bodyB, {
    pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z), axisA: new CANNON.Vec3(0, 0, 1),
    pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z), axisB: new CANNON.Vec3(0, 0, 1),
    maxForce: maxForce
  });
  h.enableMotor();
  return h;
}

function buildWorld() {
  var world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 14;
  var ground = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(200, 0.5, 10)) });
  ground.position.set(0, -0.5, 0);
  world.addBody(ground);
  return world;
}

var FOOT_H = { hx: 0.12, hy: 0.045, hz: 0.07 };
var SHIN_H = { hx: 0.065, hy: 0.19, hz: 0.065 };
var THIGH_H = { hx: 0.08, hy: 0.19, hz: 0.08 };
var PELVIS_H = { hx: 0.13, hy: 0.08, hz: 0.15 };
var ABDOMEN_H = { hx: 0.11, hy: 0.07, hz: 0.13 };
var CHEST_H = { hx: 0.16, hy: 0.13, hz: 0.16 };
var HEAD_H = { hx: 0.14, hy: 0.14, hz: 0.14 };
var UPARM_H = { hx: 0.055, hy: 0.15, hz: 0.055 };
var FOREARM_H = { hx: 0.05, hy: 0.13, hz: 0.05 };
var Y = { foot: 0.045, shin: 0.28, thigh: 0.66, pelvis: 0.93, abdomen: 1.08, chest: 1.28, head: 1.55, upperArm: 1.22, forearm: 0.94, shoulder: 1.37 };

function createCreature(world, genome, idx, startX, z) {
  var groupBit = 1 << (idx + 2);
  var filter = { collisionFilterGroup: groupBit, collisionFilterMask: 1 };

  var pelvis = box(PELVIS_H.hx, PELVIS_H.hy, PELVIS_H.hz, 0.6, { x: startX, y: Y.pelvis, z: z }, filter);
  var abdomen = box(ABDOMEN_H.hx, ABDOMEN_H.hy, ABDOMEN_H.hz, 0.3, { x: startX, y: Y.abdomen, z: z }, filter);
  var chest = box(CHEST_H.hx, CHEST_H.hy, CHEST_H.hz, 0.9, { x: startX, y: Y.chest, z: z }, filter);
  var head = box(HEAD_H.hx, HEAD_H.hy, HEAD_H.hz, 0.25, { x: startX, y: Y.head, z: z }, filter);
  [pelvis, abdomen, chest, head].forEach(function (b) { world.addBody(b); });

  var waist = hinge(pelvis, { x: 0, y: PELVIS_H.hy, z: 0 }, abdomen, { x: 0, y: -ABDOMEN_H.hy, z: 0 }, 100);
  var spine = hinge(abdomen, { x: 0, y: ABDOMEN_H.hy, z: 0 }, chest, { x: 0, y: -CHEST_H.hy, z: 0 }, 90);
  var neck = hinge(chest, { x: 0, y: CHEST_H.hy, z: 0 }, head, { x: 0, y: -HEAD_H.hy, z: 0 }, 20);
  [waist, spine, neck].forEach(function (c) { world.addConstraint(c); });

  var arms = [];
  [-0.22, 0.22].forEach(function (zo) {
    var upperArm = box(UPARM_H.hx, UPARM_H.hy, UPARM_H.hz, 0.15, { x: startX, y: Y.upperArm, z: z + zo }, filter);
    var forearm = box(FOREARM_H.hx, FOREARM_H.hy, FOREARM_H.hz, 0.12, { x: startX, y: Y.forearm, z: z + zo }, filter);
    world.addBody(upperArm); world.addBody(forearm);
    var shoulder = hinge(chest, { x: 0, y: Y.shoulder - Y.chest, z: zo }, upperArm, { x: 0, y: UPARM_H.hy, z: 0 }, 25);
    var elbow = hinge(upperArm, { x: 0, y: -UPARM_H.hy, z: 0 }, forearm, { x: 0, y: FOREARM_H.hy, z: 0 }, 15);
    world.addConstraint(shoulder); world.addConstraint(elbow);
    arms.push({ upperArm: upperArm, forearm: forearm, shoulder: shoulder, elbow: elbow });
  });

  var legs = [];
  [-0.15, 0.15].forEach(function (zo) {
    var thigh = box(THIGH_H.hx, THIGH_H.hy, THIGH_H.hz, 0.4, { x: startX, y: Y.thigh, z: z + zo }, filter);
    var shin = box(SHIN_H.hx, SHIN_H.hy, SHIN_H.hz, 0.28, { x: startX, y: Y.shin, z: z + zo }, filter);
    var foot = box(FOOT_H.hx, FOOT_H.hy, FOOT_H.hz, 0.15, { x: startX + 0.03, y: Y.foot, z: z + zo }, filter);
    world.addBody(thigh); world.addBody(shin); world.addBody(foot);
    var hip = hinge(pelvis, { x: 0, y: -PELVIS_H.hy, z: zo }, thigh, { x: 0, y: THIGH_H.hy, z: 0 }, 90);
    var knee = hinge(thigh, { x: 0, y: -THIGH_H.hy, z: 0 }, shin, { x: 0, y: SHIN_H.hy, z: 0 }, 70);
    var ankle = hinge(shin, { x: 0, y: -SHIN_H.hy, z: 0 }, foot, { x: -0.03, y: 0, z: 0 }, 30);
    world.addConstraint(hip); world.addConstraint(knee); world.addConstraint(ankle);
    legs.push({ thigh: thigh, shin: shin, foot: foot, hip: hip, knee: knee, ankle: ankle, contact: false });
  });

  return {
    pelvis: pelvis, abdomen: abdomen, chest: chest, head: head, arms: arms, legs: legs,
    waist: waist, spine: spine, neck: neck, genome: genome,
    best: 0, alive: true, standTicks: 0
  };
}

function clampFloor(body, halfH) {
  if (body.position.y < halfH) { body.position.y = halfH; if (body.velocity.y < 0) body.velocity.y = 0; }
}
function clampCreatureToFloor(c) {
  clampFloor(c.pelvis, PELVIS_H.hy); clampFloor(c.abdomen, ABDOMEN_H.hy); clampFloor(c.chest, CHEST_H.hy); clampFloor(c.head, HEAD_H.hy);
  c.arms.forEach(function (a) { clampFloor(a.upperArm, UPARM_H.hy); clampFloor(a.forearm, FOREARM_H.hy); });
  c.legs.forEach(function (l) { clampFloor(l.thigh, THIGH_H.hy); clampFloor(l.shin, SHIN_H.hy); clampFloor(l.foot, FOOT_H.hy); });
}

function simulateGeneration(genomes, rule) {
  var world = buildWorld();
  var creatures = genomes.map(function (g, i) {
    return createCreature(world, g, i, 0, (i - (genomes.length - 1) / 2) * 0.9);
  });
  for (var step = 0; step < GEN_STEPS; step++) {
    creatures.forEach(function (c) {
      if (!c.alive) return;
      var distLeft = Math.max(0, Math.min(1, (rule.goalDistance - c.chest.position.x) / rule.goalDistance));
      var inputs = [
        zAngle(c.chest.quaternion), c.chest.angularVelocity.z / 4,
        zAngle(c.pelvis.quaternion), zAngle(c.abdomen.quaternion), zAngle(c.head.quaternion),
        c.legs[0].contact ? 1 : 0, c.legs[1].contact ? 1 : 0,
        zAngle(c.legs[0].thigh.quaternion), zAngle(c.legs[0].shin.quaternion),
        zAngle(c.legs[1].thigh.quaternion), zAngle(c.legs[1].shin.quaternion),
        distLeft
      ];
      var out = forward(c.genome, inputs).map(function (v) { return isFinite(v) ? v : 0; });
      limitedMotor(c.waist, c.pelvis, c.abdomen, -0.5, 0.5, out[0] * 4);
      limitedMotor(c.spine, c.abdomen, c.chest, -0.4, 0.4, out[1] * 4);
      limitedMotor(c.neck, c.chest, c.head, -0.6, 0.6, out[2] * 3);
      limitedMotor(c.arms[0].shoulder, c.chest, c.arms[0].upperArm, -2.0, 2.0, out[3] * 4);
      limitedMotor(c.arms[1].shoulder, c.chest, c.arms[1].upperArm, -2.0, 2.0, out[4] * 4);
      limitedMotor(c.arms[0].elbow, c.arms[0].upperArm, c.arms[0].forearm, -2.2, 0.2, out[5] * 4);
      limitedMotor(c.arms[1].elbow, c.arms[1].upperArm, c.arms[1].forearm, -2.2, 0.2, out[6] * 4);
      limitedMotor(c.legs[0].hip, c.pelvis, c.legs[0].thigh, -1.3, 1.3, out[7] * 5);
      limitedMotor(c.legs[1].hip, c.pelvis, c.legs[1].thigh, -1.3, 1.3, out[8] * 5);
      limitedMotor(c.legs[0].knee, c.legs[0].thigh, c.legs[0].shin, -2.3, 0.3, out[9] * 5);
      limitedMotor(c.legs[1].knee, c.legs[1].thigh, c.legs[1].shin, -2.3, 0.3, out[10] * 5);
      limitedMotor(c.legs[0].ankle, c.legs[0].shin, c.legs[0].foot, -0.6, 0.6, out[11] * 4);
      limitedMotor(c.legs[1].ankle, c.legs[1].shin, c.legs[1].foot, -0.6, 0.6, out[12] * 4);

      c.legs.forEach(function (l) { l.contact = l.foot.position.y < 0.1; });
      var forbidden = rule.forbiddenPart === 'head' ? c.head : c.chest;
      if (forbidden.position.y < 0.3) c.alive = false;
      if (c.chest.position.y > 1.0) c.standTicks++;
      if (c.chest.position.x > c.best) c.best = c.chest.position.x;
      if (!isFinite(c.chest.position.y) || !isFinite(c.chest.position.x) || c.chest.position.y < -3) c.alive = false;
    });
    world.step(1 / HZ);
    creatures.forEach(clampCreatureToFloor);
  }
  return creatures.map(function (c) {
    return { genome: c.genome, best: c.best, standFrac: c.standTicks / GEN_STEPS };
  });
}

var MILESTONES = [
  { key: 'rampe', label: 'Il rampe', test: function (m) { return m.pct >= 5; } },
  { key: 'debout', label: 'Il tient debout', test: function (m) { return m.standFrac >= 0.3; } },
  { key: 'pas', label: 'Premiers pas', test: function (m) { return m.pct >= 30; } },
  { key: 'arrivee', label: 'Arrivée au point B', test: function (m) { return m.pct >= 100; } }
];

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fallback; }
}

var rule = { forbiddenPart: 'torso', goalDistance: 10 };
var state = loadJSON(STATE_PATH, { generation: 0, bestPct: 0, currentGenomes: null, history: [], milestones: {}, lastRule: null, updatedAt: null });
if (!state.lastRule) state.lastRule = { forbiddenPart: rule.forbiddenPart, goalDistance: rule.goalDistance };

var genomesValid = state.currentGenomes && state.currentGenomes.length === POP
  && state.currentGenomes.every(function (g) { return Array.isArray(g) && g.length === GLEN; });
var genomes = genomesValid ? state.currentGenomes : Array.from({ length: POP }, randGenome);
if (!genomesValid) { state.generation = 0; state.bestPct = 0; state.history = []; state.milestones = {}; }

function fitPct(best) { return Math.max(0, Math.min(100, (best / rule.goalDistance) * 100)); }
function recordMilestones(gen, metrics, genome) {
  MILESTONES.forEach(function (d) {
    if (state.milestones[d.key]) return;
    if (d.test(metrics)) state.milestones[d.key] = { generation: gen, label: d.label, pct: Math.round(metrics.pct), genome: genome };
  });
}

for (var run = 0; run < GENERATIONS_PER_RUN; run++) {
  var results = simulateGeneration(genomes, rule);
  results.forEach(function (r) { r.pct = fitPct(r.best); });
  results.sort(function (a, b) { return b.pct - a.pct; });

  state.generation++;
  var top = results[0];
  if (top.pct > state.bestPct) state.bestPct = top.pct;
  recordMilestones(state.generation, top, top.genome);

  state.history.push({
    gen: state.generation, pct: Math.round(top.pct * 10) / 10,
    genome: top.genome, rule: { forbiddenPart: rule.forbiddenPart, goalDistance: rule.goalDistance }
  });
  if (state.history.length > HISTORY_LIMIT) state.history.shift();

  var next = [top.genome, mutate(top.genome), randGenome(), randGenome()];
  var pool = results.slice(0, Math.max(2, Math.floor(POP / 2)));
  while (next.length < POP) {
    var a = pool[Math.floor(Math.random() * pool.length)].genome;
    var b = pool[Math.floor(Math.random() * pool.length)].genome;
    next.push(mutate(crossover(a, b)));
  }
  genomes = next;
}

state.currentGenomes = genomes;
state.updatedAt = new Date().toISOString();
fs.writeFileSync(STATE_PATH, JSON.stringify(state));
console.log('Génération', state.generation, '—', Math.round(state.bestPct) + '%');
