const fs = require('fs');
const path = require('path');
const CANNON = require('cannon');

const STATE_PATH = path.join(__dirname, 'state.json');
const RULE_PATH = path.join(__dirname, 'rule.json');

const POP = 4;
<<<<<<< HEAD
const IN = 12, HID = 10;
const OUT = 13;
=======
const IN = 12, HID = 10, OUT = 13;
>>>>>>> 949b17b (premier envoie)
const GLEN = IN * HID + HID + HID * OUT + OUT;
const HZ = 60;
const GEN_SECONDS = 9;
const GEN_STEPS = HZ * GEN_SECONDS;
<<<<<<< HEAD
const GENERATIONS_PER_TASK_PER_RUN = 2;
const HISTORY_LIMIT = 4000;
const RIG_VERSION = 2;
const CHEST_REST_Y = 1.28;
const TASKS = ['marche', 'course', 'rampe', 'saut', 'accroupi'];
const TASK_DEFAULTS = {
  marche: { forbiddenPart: 'torso', goalDistance: 10 },
  course: { forbiddenPart: 'torso', goalDistance: 10 },
  rampe: { forbiddenPart: 'head', goalDistance: 8 },
  saut: { forbiddenPart: 'torso', goalDistance: 30 },
  accroupi: { forbiddenPart: 'torso', goalDistance: 40 }
};
=======
const GENERATIONS_PER_RUN = 6;
const HISTORY_LIMIT = 20000;
>>>>>>> 949b17b (premier envoie)

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
<<<<<<< HEAD
var Y = { foot: 0.045, shin: 0.28, thigh: 0.66, pelvis: 0.93, abdomen: 1.08, chest: CHEST_REST_Y, head: 1.55, upperArm: 1.22, forearm: 0.94, shoulder: 1.37 };
=======
var Y = { foot: 0.045, shin: 0.28, thigh: 0.66, pelvis: 0.93, abdomen: 1.08, chest: 1.28, head: 1.55, upperArm: 1.22, forearm: 0.94, shoulder: 1.37 };
>>>>>>> 949b17b (premier envoie)

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
<<<<<<< HEAD
    best: 0, alive: true, standTicks: 0, airTicks: 0, crouchTicks: 0, maxChestY: Y.chest
  };
}

function scoreCreature(c, rule) {
  var metrics = { standFrac: c.standTicks / GEN_STEPS, airFrac: c.airTicks / GEN_STEPS };
  var pct;
  if (rule.__task === 'saut') {
    var targetH = (rule.goalDistance || 30) / 100;
    var extra = Math.max(0, c.maxChestY - CHEST_REST_Y);
    pct = Math.max(0, Math.min(100, (extra / targetH) * 100));
  } else if (rule.__task === 'accroupi') {
    pct = Math.max(0, Math.min(100, (c.crouchTicks / GEN_STEPS) * 100));
  } else {
    pct = Math.max(0, Math.min(100, (c.best / rule.goalDistance) * 100));
    if (rule.__task === 'course') {
      pct = Math.min(100, pct * (1 + 0.2 * Math.min(1, metrics.airFrac * 8)));
    } else if (rule.__task === 'rampe') {
      if (metrics.standFrac > 0.3) pct *= 0.4;
    }
  }
  metrics.pct = pct;
  return metrics;
}

function simulateGeneration(genomes, rule) {
  var world = buildWorld();
  var crouchTarget = (rule.goalDistance || 40) / 100;
=======
    best: 0, alive: true, standTicks: 0
  };
}

function simulateGeneration(genomes, rule) {
  var world = buildWorld();
>>>>>>> 949b17b (premier envoie)
  var creatures = genomes.map(function (g, i) {
    return createCreature(world, g, i, 0, (i - (genomes.length - 1) / 2) * 0.9);
  });
  for (var step = 0; step < GEN_STEPS; step++) {
    creatures.forEach(function (c) {
      if (!c.alive) return;
<<<<<<< HEAD
      var distLeft = Math.max(0, Math.min(1, ((rule.goalDistance || 10) - c.chest.position.x) / (rule.goalDistance || 10)));
=======
      var distLeft = Math.max(0, Math.min(1, (rule.goalDistance - c.chest.position.x) / rule.goalDistance));
>>>>>>> 949b17b (premier envoie)
      var inputs = [
        zAngle(c.chest.quaternion), c.chest.angularVelocity.z / 4,
        zAngle(c.pelvis.quaternion), zAngle(c.abdomen.quaternion), zAngle(c.head.quaternion),
        c.legs[0].contact ? 1 : 0, c.legs[1].contact ? 1 : 0,
        zAngle(c.legs[0].thigh.quaternion), zAngle(c.legs[0].shin.quaternion),
        zAngle(c.legs[1].thigh.quaternion), zAngle(c.legs[1].shin.quaternion),
        distLeft
      ];
      var out = forward(c.genome, inputs);
      c.waist.setMotorSpeed(out[0] * 4);
      c.spine.setMotorSpeed(out[1] * 4);
      c.neck.setMotorSpeed(out[2] * 3);
      c.arms[0].shoulder.setMotorSpeed(out[3] * 4);
      c.arms[1].shoulder.setMotorSpeed(out[4] * 4);
      c.arms[0].elbow.setMotorSpeed(out[5] * 4);
      c.arms[1].elbow.setMotorSpeed(out[6] * 4);
      c.legs[0].hip.setMotorSpeed(out[7] * 5);
      c.legs[1].hip.setMotorSpeed(out[8] * 5);
      c.legs[0].knee.setMotorSpeed(out[9] * 5);
      c.legs[1].knee.setMotorSpeed(out[10] * 5);
      c.legs[0].ankle.setMotorSpeed(out[11] * 4);
      c.legs[1].ankle.setMotorSpeed(out[12] * 4);

      c.legs.forEach(function (l) { l.contact = l.foot.position.y < 0.1; });
      var forbidden = rule.forbiddenPart === 'head' ? c.head : c.chest;
      if (forbidden.position.y < 0.3) c.alive = false;
<<<<<<< HEAD

      if (c.chest.position.y > 1.0) c.standTicks++;
      if (!c.legs[0].contact && !c.legs[1].contact) c.airTicks++;
      if (Math.abs(c.chest.position.y - crouchTarget) < 0.08 && c.chest.position.y > 0.3) c.crouchTicks++;
      if (c.chest.position.y > c.maxChestY) c.maxChestY = c.chest.position.y;
=======
      if (c.chest.position.y > 1.0) c.standTicks++;
>>>>>>> 949b17b (premier envoie)
      if (c.chest.position.x > c.best) c.best = c.chest.position.x;
    });
    world.step(1 / HZ);
  }
  return creatures.map(function (c) {
<<<<<<< HEAD
    var metrics = scoreCreature(c, rule);
    return { genome: c.genome, pct: metrics.pct, standFrac: metrics.standFrac, airFrac: metrics.airFrac };
  });
}

var TASK_MILESTONES = {
  marche: [
    { key: 'mouv', label: 'Premier mouvement', test: function (m) { return m.pct >= 5; } },
    { key: 'debout', label: 'Il tient debout', test: function (m) { return m.standFrac >= 0.3; } },
    { key: 'pas', label: 'Premiers pas', test: function (m) { return m.pct >= 30; } },
    { key: 'arrivee', label: 'Arrivée au point B', test: function (m) { return m.pct >= 100; } }
  ],
  course: [
    { key: 'mouv', label: 'Premier mouvement', test: function (m) { return m.pct >= 5; } },
    { key: 'vol', label: 'Première foulée aérienne', test: function (m) { return m.airFrac >= 0.05; } },
    { key: 'pas', label: 'Ça court', test: function (m) { return m.pct >= 30; } },
    { key: 'arrivee', label: 'Arrivée au point B', test: function (m) { return m.pct >= 100; } }
  ],
  rampe: [
    { key: 'mouv', label: 'Premier mouvement', test: function (m) { return m.pct >= 5; } },
    { key: 'pas', label: 'Reptation efficace', test: function (m) { return m.pct >= 30; } },
    { key: 'arrivee', label: 'Arrivée au point B', test: function (m) { return m.pct >= 100; } }
  ],
  saut: [
    { key: 'mouv', label: 'Premier décollage', test: function (m) { return m.pct >= 5; } },
    { key: 'demi', label: 'Bonne impulsion', test: function (m) { return m.pct >= 40; } },
    { key: 'obj', label: 'Hauteur visée atteinte', test: function (m) { return m.pct >= 100; } }
  ],
  accroupi: [
    { key: 'mouv', label: 'Premier fléchissement', test: function (m) { return m.pct >= 5; } },
    { key: 'tenue', label: 'Tient la position', test: function (m) { return m.pct >= 50; } },
    { key: 'obj', label: 'Position stable et complète', test: function (m) { return m.pct >= 100; } }
  ]
};
=======
    return { genome: c.genome, best: c.best, standFrac: c.standTicks / GEN_STEPS };
  });
}

var MILESTONES = [
  { key: 'rampe', label: 'Il rampe', test: function (m) { return m.pct >= 5; } },
  { key: 'debout', label: 'Il tient debout', test: function (m) { return m.standFrac >= 0.3; } },
  { key: 'pas', label: 'Premiers pas', test: function (m) { return m.pct >= 30; } },
  { key: 'arrivee', label: 'Arrivée au point B', test: function (m) { return m.pct >= 100; } }
];
>>>>>>> 949b17b (premier envoie)

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fallback; }
}

<<<<<<< HEAD
var rules = loadJSON(RULE_PATH, {});
TASKS.forEach(function (t) { if (!rules[t]) rules[t] = TASK_DEFAULTS[t]; });

var state = loadJSON(STATE_PATH, { rigVersion: 0, tasks: {}, updatedAt: null });
if (!state.tasks) state.tasks = {};
var rigChanged = state.rigVersion !== RIG_VERSION;
if (rigChanged) { state.tasks = {}; state.rigVersion = RIG_VERSION; }

TASKS.forEach(function (task) {
  var rule = Object.assign({ __task: task }, rules[task]);
  var ts = state.tasks[task];
  var freshTask = !ts;
  if (!ts) {
    ts = { generation: 0, bestPct: 0, currentGenomes: null, history: [], milestones: {}, lastRule: null };
    state.tasks[task] = ts;
  }
  var ruleChanged = !ts.lastRule || ts.lastRule.forbiddenPart !== rule.forbiddenPart || ts.lastRule.goalDistance !== rule.goalDistance;
  if (ruleChanged && !freshTask) {
    ts.generation = 0; ts.bestPct = 0; ts.currentGenomes = null; ts.milestones = {}; ts.history = [];
  }
  ts.lastRule = { forbiddenPart: rule.forbiddenPart, goalDistance: rule.goalDistance };

  var genomes = ts.currentGenomes && ts.currentGenomes.length === POP
    ? ts.currentGenomes
    : Array.from({ length: POP }, randGenome);

  function recordMilestones(gen, metrics, genome) {
    var defs = TASK_MILESTONES[task] || [];
    defs.forEach(function (d) {
      if (ts.milestones[d.key]) return;
      if (d.test(metrics)) ts.milestones[d.key] = { generation: gen, label: d.label, pct: Math.round(metrics.pct), genome: genome };
    });
  }

  for (var run = 0; run < GENERATIONS_PER_TASK_PER_RUN; run++) {
    var results = simulateGeneration(genomes, rule);
    results.sort(function (a, b) { return b.pct - a.pct; });

    ts.generation++;
    var top = results[0];
    if (top.pct > ts.bestPct) ts.bestPct = top.pct;
    recordMilestones(ts.generation, top, top.genome);

    ts.history.push({
      gen: ts.generation, pct: Math.round(top.pct * 10) / 10,
      genome: top.genome, rule: { task: task, forbiddenPart: rule.forbiddenPart, goalDistance: rule.goalDistance }
    });
    if (ts.history.length > HISTORY_LIMIT) ts.history.shift();

    var next = [top.genome, mutate(top.genome)];
    var pool = results.slice(0, Math.max(2, Math.floor(POP / 2)));
    while (next.length < POP) {
      var a = pool[Math.floor(Math.random() * pool.length)].genome;
      var b = pool[Math.floor(Math.random() * pool.length)].genome;
      next.push(mutate(crossover(a, b)));
    }
    genomes = next;
  }
  ts.currentGenomes = genomes;
});

state.updatedAt = new Date().toISOString();
fs.writeFileSync(STATE_PATH, JSON.stringify(state));
console.log('Cycle terminé —', TASKS.map(function (t) { return t + ':' + state.tasks[t].generation; }).join(', '));
=======
var rule = loadJSON(RULE_PATH, { forbiddenPart: 'torso', goalDistance: 10 });
var state = loadJSON(STATE_PATH, { generation: 0, bestPct: 0, currentGenomes: null, history: [], milestones: {}, lastRule: null, updatedAt: null });

var ruleChanged = !state.lastRule || state.lastRule.forbiddenPart !== rule.forbiddenPart || state.lastRule.goalDistance !== rule.goalDistance;
if (ruleChanged) {
  state.generation = 0; state.bestPct = 0; state.currentGenomes = null; state.milestones = {}; state.history = [];
  state.lastRule = { forbiddenPart: rule.forbiddenPart, goalDistance: rule.goalDistance };
}

var genomes = state.currentGenomes && state.currentGenomes.length === POP
  ? state.currentGenomes
  : Array.from({ length: POP }, randGenome);

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

  var next = [top.genome, mutate(top.genome)];
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
>>>>>>> 949b17b (premier envoie)
