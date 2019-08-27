const [width, height, vmin, vmax] = function() {
    const   x = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            w = (x.innerWidth || e.clientWidth || g.clientWidth),
            h = (x.innerHeight|| e.clientHeight|| g.clientHeight);
    return [w, h, Math.min(w, h), Math.max(w, h)];
}()

function drawArcs ({ originX, originY, offset, gapSize, distance, arcs, highlightedArcs }) {
    const fraction = TWO_PI / arcs;
    offset = offset || 0;
    gapSize = gapSize || 0;
    highlightedArcs = highlightedArcs || [];

    for (let arcNo = 0; arcNo < arcs; arcNo++) {
        if (highlightedArcs[arcNo]) {
            stroke(255, 0, 0);
        }
        else {
            stroke(0, 0, 0);
        }

        arc(originX, 
            originY, 
            distance, 
            distance, 
            offset + fraction * arcNo + gapSize,
            offset + fraction * (arcNo + 1) - gapSize);
    }
    stroke(0, 0, 0);
}

function getCenterOfMassOfArc({ originX, originY, distance, offset, arcs, arcNo }) {
    const fraction = TWO_PI / arcs;
    return [originX + PI * distance * cos(offset + fraction * arcNo), originY + PI * distance * sin(offset + fraction * arcNo)];
}

let globalArcHighlights;
let centersOfMass;

function mouseMoved() {
    const [closestIndex, closestDistance] = centersOfMass.reduce(([bestIdx, bestDist], [x, y], idx) => {
        const distance = Math.pow(Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2), 0.5)
        return distance < bestDist ? [idx, distance] : [bestIdx, bestDist];
    }, [-1, +Infinity]);

    if (closestDistance < 1470) {
        globalArcHighlights = {[closestIndex]: true};
    }
    else {
        globalArcHighlights = {};
    }
}



function setup() {
    createCanvas(width, height);
    globalArcHighlights = {};
    centersOfMass = [...Array(12).keys()].map(arcNo => 
        getCenterOfMassOfArc({ originX: width / 2, 
                               originY: height / 2,
                               distance: vmin * 0.8,
                               offset: 3 * PI / 2,
                               arcs: 12,
                               arcNo,
                            }))
}

function draw() {
    strokeWeight(20);
    strokeCap(SQUARE);
    smooth();
    drawArcs({
        originX: width / 2,
        originY: height / 2,
        distance: vmin * 0.8,
        offset: 3 * PI / 2 - PI / 12,
        arcs: 12,
        gapSize: 0.03,
        highlightedArcs: globalArcHighlights,
    })
    color(255, 255, 255);
    for (let arcNo = 0; arcNo < 12; arcNo++) {
        const [x, y] = getCenterOfMassOfArc({ 
            originX: width / 2, 
            originY: height / 2,
            distance: vmin / 8,
            offset: 3 * PI / 2,
            arcs: 12,
            arcNo,
        })
        point(x, y);
    }
}
