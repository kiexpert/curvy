
var graphMeshes, graphMesh, wireMaterial;

var xMin = 0.0, xMax = 1.0;
var yMin = 0.0, yMax = 1.0;
var zMin = 0.0, zMax = 1.0; // for autosizing window

function createGraph() {
    xFunc = Parser.parse(xFuncText).toJSFunction(['t', 'i']);
    yFunc = Parser.parse(yFuncText).toJSFunction(['t', 'i']);
    zFunc = Parser.parse(zFuncText).toJSFunction(['t', 'i']);
    yawFunc = Parser.parse(yawFuncText).toJSFunction(['t', 'i']);

    var dronBezigers = makeBeziers();
    updateGraph(dronBeziers, tMax);
}

function updateGraph(dronBeziers, tCur)
{
    while (graphMeshes && graphMeshes.length > 0) {
        graphMesh = graphMeshes.shift();
        scene.remove(graphMesh);
    }
    xMin = 0.0, xMax = 1.0;
    yMin = 0.0, yMax = 1.0;
    zMin = 0.0, zMax = 1.0;

    graphMeshes = [];
    //return;

    for (var id = 0; id < numDrones; id++) {
        var beziers = dronBeziers[id];

        var ib = beziers.length;
        while(--ib >= 0) {
            var bz = beziers[ib];
            if (bz.mesh) {
                if (bz.t0 > tCur) {
                    scene.remove(bz.mesh);
                    continue;
                }
                if (bz.t1 <= tCur) {
                    scene.add(bz.mesh);
                    graphMeshes.push(bz.mesh);
                    continue;
                }
                scene.remove(bz.mesh);
                bz.mesh = null;
            }

            Knot = THREE.Curve.create(
                function () { },
                function (t) {
                    // default:    0 < t < 1
                    //    want: tMin < t < tMax
                    if(tCur >= bz.t1)
                        bz.iter0to1(t);
                    else
                        bz.iter(t * (tCur - bz.t0) + bz.t0);
                    return new THREE.Vector3(bz.x, bz.y, bz.z).multiplyScalar(1);
                }
            );
    
            // knot stuff
            myKnot = new Knot;
    
            var closedTube = false; // connect the ends
            var debug = false; // show normal vectors
            //var segments = Math.ceil((tMax - tMin) * Math.pow(10, timeDivs));
            var segments = 20;//timeDivs;
            var tubeGeometry = new THREE.TubeGeometry(myKnot, segments, tubeRadius, radiusSegments, closedTube, debug);
    
            ///////////////////////////////////////////////
            // calculate vertex colors based on T values //
            ///////////////////////////////////////////////
            var color, point, face, numberOfSides, vertexIndex;
            // faces are indexed using characters
            var faceIndices = ['a', 'b', 'c', 'd'];
            // first, assign colors to vertices as desired
            for (var s = 0; s <= segments; s++) {
                for (var r = 0; r < radiusSegments; r++) {
                    vertexIndex = r + s * radiusSegments;
                    color = new THREE.Color(0xffffff);
                    // according to length along curve, repeat once
                    color.setHSL((1 * s / segments) % 1, 1, 0.5);
                    // according to radius segment -- ribbons of color
                    // color.setHSV( (1 * r / radiusSegments) % 1, 1, 1 );
                    tubeGeometry.colors[vertexIndex] = color; // use this array for convenience
                }
            }
            // copy the colors as necessary to the face's vertexColors array.
            for (var i = 0; i < tubeGeometry.faces.length; i++) {
                face = tubeGeometry.faces[i];
                numberOfSides = (face instanceof THREE.Face3) ? 3 : 4;
                for (var j = 0; j < numberOfSides; j++) {
                    vertexIndex = face[faceIndices[j]];
                    face.vertexColors[j] = tubeGeometry.colors[vertexIndex];
                }
            }
            ///////////////////////
            // end vertex colors //
            ///////////////////////
    
            // for auto-sizing window
            tubeGeometry.computeBoundingBox();
            xMin = Math.min(xMin, tubeGeometry.boundingBox.min.x);
            xMax = Math.max(xMax, tubeGeometry.boundingBox.max.x);
            yMin = Math.min(yMin, tubeGeometry.boundingBox.min.y);
            yMax = Math.max(yMax, tubeGeometry.boundingBox.max.y);
            zMin = Math.min(zMin, tubeGeometry.boundingBox.min.z);
            zMax = Math.max(zMax, tubeGeometry.boundingBox.max.z);
    
            wireMaterial.map.repeat.set(segments, radiusSegments);
    
            graphMesh = new THREE.Mesh(tubeGeometry, wireMaterial);
            graphMesh.doubleSided = true;

            bz.mesh = tCur >= bz.t1 ? graphMesh : null;

            scene.add(graphMesh);
            graphMeshes.push(graphMesh);
        }
    }
}

var dest_tMax = tMax, dest_tMin = tMin;
var tInterval = 0.01; // s.
var tCurrent = tMax;
var playTimerId = null;

function playGraph() {
    if (playTimerId) {
        clearTimeout(playTimerId);
        tMin = dest_tMin;
        tMax = dest_tMax;
        updateGraph(dronBeziers, tMax);
    }

    dest_tMax = tMax, dest_tMin = tMin;
    tInterval = 0.01; // s.
    tCurrent = tMin;
    playTimerId = null;

    console.log(playSpeed);
    function playGraphOne() {
        updateGraph(dronBeziers, tCurrent);
        tCurrent += tInterval * playSpeed;
        //console.log("tCurrent", tCurrent, dest_tMax);
        if (tCurrent <= dest_tMax) {
            playTimerId = window.setTimeout(
                playGraphOne,
                tInterval * 1000.
            );
        }
    }
    playTimerId = window.setTimeout(
        playGraphOne,
        tInterval * 1000.
    );
}
