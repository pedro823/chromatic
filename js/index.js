const [width, height, vmin, vmax] = function() {
    const   x = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            w = (x.innerWidth || e.clientWidth || g.clientWidth),
            h = (x.innerHeight|| e.clientHeight|| g.clientHeight);
    return [w, h, Math.min(w, h), Math.max(w, h)];
}()
let originX, originY, distance, arcs, fraction, offset;
let bridges;
let constructingBridge;
let globalArcHighlights;
let centersOfMass;

// --- Position calculators ---
function getSynapsePosition(arcNo) {
    return [originX + (distance * 0.4) * cos(offset + fraction * arcNo), originY + (distance * 0.4) * sin(offset + fraction * arcNo)];
}

function getCenterOfMassOfArc(arcNo) {
    return [originX + distance / 2 * cos(offset + fraction * arcNo), originY + distance / 2 * sin(offset + fraction * arcNo)];
}

// --- drawing functions ---
function drawArcs ({ gapSize, highlightedArcs }) {
    const adjustedOffset = offset - PI / arcs;
    gapSize = gapSize || 0;
    highlightedArcs = highlightedArcs || {};

    for (let arcNo = 0; arcNo < arcs; arcNo++) {
        stroke(highlightedArcs[arcNo] ? 255 : 0, 0, 0);

        arc(originX, 
            originY, 
            distance, 
            distance, 
            adjustedOffset + fraction * arcNo + gapSize,
            adjustedOffset + fraction * (arcNo + 1) - gapSize);
    }
    stroke(0, 0, 0);
}

function drawSynapse({ arcNo, highlighted }) {
    if (highlighted) {
        stroke(255, 0, 0);
    }
    point(...getSynapsePosition(arcNo));
    if (highlighted) {
        stroke(0, 0, 0);
    }
}

function drawConstructingBridge(synapseNo) {
    stroke(200, 200, 0);
    line(...getSynapsePosition(synapseNo), mouseX, mouseY);
}

function drawSynapseConnection(syn1, syn2) {
    const synapsePos1 = getSynapsePosition(syn1);
    const synapsePos2 = getSynapsePosition(syn2);
    line(...synapsePos1, ...synapsePos2);
}

// --- fundamentals: Whole step, HalfStep ---
function drawWholeStep(begginingAt) {
    stroke(32, 201, 103);
    drawSynapseConnection(begginingAt, (begginingAt + 2) % arcs);
    return (begginingAt + 2) % arcs;
}

function drawHalfStep(begginingAt) {
    stroke(89, 178, 194);
    drawSynapseConnection(begginingAt, (begginingAt + 1) % arcs);
    return (begginingAt + 1) % arcs;
}

// --- scales ---
function drawMajorScale(begginingAt) {
    // W W H W W W H
    begginingAt = drawWholeStep(begginingAt);
    begginingAt = drawWholeStep(begginingAt);
    begginingAt = drawHalfStep(begginingAt);
    begginingAt = drawWholeStep(begginingAt);
    begginingAt = drawWholeStep(begginingAt);
    begginingAt = drawWholeStep(begginingAt);
    drawHalfStep(begginingAt);
}

function drawMinorScale(begginingAt) {
    drawMajorScale((begginingAt + 15) % arcs);
}

// --- defined for p5 ---
function setup() {
    createCanvas(width, height);
    originX = width / 2;
    originY = height / 2;
    distance = vmin * 0.8;
    arcs = 12;
    fraction = TWO_PI / arcs;
    offset = 3 * PI / 2;
    bridges = [];
    constructingBridge = null;

    globalArcHighlights = {};
    centersOfMass = [...Array(12).keys()].map(arcNo => 
        getCenterOfMassOfArc(arcNo))
}

function draw() {
    clear();
    strokeWeight(20);
    strokeCap(SQUARE);
    smooth();
    noFill();
    drawArcs({
        gapSize: 0.03,
        highlightedArcs: globalArcHighlights,
    });
    drawMajorScale(0);
    stroke(0, 210, 210);
    bridges.forEach(([syn1, syn2]) => drawSynapseConnection(syn1, syn2));
    stroke(0, 0, 0);
    for (let arcNo = 0; arcNo < 12; arcNo++) {
        drawSynapse({ highlighted: globalArcHighlights[arcNo], arcNo, })
    }
    if (constructingBridge) {
        drawConstructingBridge(constructingBridge);
    }
}

function mouseMoved() {
    const [closestIndex, closestDistance] = centersOfMass.reduce(([bestIdx, bestDist], [x, y], idx) => {
        const distance = Math.pow(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2), 0.5)
        return distance < bestDist ? [idx, distance] : [bestIdx, bestDist];
    }, [-1, +Infinity]);

    // If it's close enough, highlight
    if (closestDistance < 71) {
        globalArcHighlights = {[closestIndex]: true};
    }
    else {
        globalArcHighlights = {};
    }
}

function mouseClicked() {
    const highlightedNotes = Object.keys(globalArcHighlights)
    if (highlightedNotes.length === 0) {
        return;
    }
    const noteToConstruct = highlightedNotes[0];
    if (constructingBridge === null) {
        constructingBridge = noteToConstruct;
        return;
    }

    if (constructingBridge === noteToConstruct) {
        constructingBridge = null;
        return;
    }
    bridges.push([constructingBridge, noteToConstruct]);
    recalculateNotes();
    constructingBridge = null;
}

// --- Tone.js related ---
const translationTable = ['C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3'];
let playingNotes = new Set();
let synths = []

function difference(notesToPlay, playingNotes) {
    for (let note of playingNotes) {
        notesToPlay.delete(note);
    }    
    return notesToPlay;
}

function recalculateNotes() {
    const notesToPlay = new Set(
                            bridges.reduce((acc, bridge) => [...acc, ...bridge.map(synapse => translationTable[synapse])], []));
    const notesToAddToLoop = difference(notesToPlay, playingNotes);
    for (let note of notesToAddToLoop) {
        createLoop(note);
    }
}

function createLoop(note) {
    const synth = new Tone.Synth().toMaster();
    synth.triggerAttack(note);
    synths.push(synth);
    playingNotes.add(note);
}

document.addEventListener('click', () => Tone.start());
Tone.Transport.bpm.value = 120;
Tone.Transport.start();