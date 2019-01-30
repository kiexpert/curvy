var dronBeziers;

function findAvoidingBezier(id, cp, fin) {
    var i = dronBeziers.length;
    while (--i >= 0) {
        var cpa = dronBeziers[i];
        var cp0 = cpa[cpa.length - 1];
        // TODO: avoiding...

        // http://blog.naver.com/kyuniitale/40022945907
        var ax, bx, cx, ay, by, cy, az, bz, cz, aw, bw, cw, tSquared, tCubed;

        /* 다항식 계수를 계산한다 */
        cx = 3.0 * (cp[1].x - cp[0].x);
        bx = 3.0 * (cp[2].x - cp[1].x) - cx;
        ax = cp[3].x - cp[0].x - cx - bx;

        cy = 3.0 * (cp[1].y - cp[0].y);
        by = 3.0 * (cp[2].y - cp[1].y) - cy;
        ay = cp[3].y - cp[0].y - cy - by;

        cz = 3.0 * (cp[1].z - cp[0].z);
        bz = 3.0 * (cp[2].z - cp[1].z) - cz;
        az = cp[3].z - cp[0].z - cz - bz;

        cw = 3.0 * (cp[1].w - cp[0].w);
        bw = 3.0 * (cp[2].w - cp[1].w) - cw;
        aw = cp[3].w - cp[0].w - cw - bw;

        //ct = 3.0 * (cp[1].t - cp[0].t);
        //bt = 3.0 * (cp[2].t - cp[1].t) - ct;
        //at = cp[3].t - cp[0].t - ct - bt;

        /* 매개변수 값 t에서 곡선 점을 계산한다 */
        //tSquared = t * t;
        //tCubed = tSquared * t;
        // x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x;
        // y = (ay * tCubed) + (bx * tSquared) + (cy * t) + cp[0].y;
    }
    return cp;
}

function makeBeziers() {
    var xFunc = Parser.parse(xFuncText).toJSFunction(['t', 'i']);
    var yFunc = Parser.parse(yFuncText).toJSFunction(['t', 'i']);
    var zFunc = Parser.parse(zFuncText).toJSFunction(['t', 'i']);
    var wFunc = Parser.parse(yawFuncText).toJSFunction(['t', 'i']);
    var dt = timeres;//Math.pow(10, timeres);

    var id = 0;
    dronBeziers = [];

    for (; id < numDrones; id++) {
        var points = [];//[[0, 0], [10, 10], [10, 0], [20, 0]];
        for (var t = tMin; t <= tMax; t += dt)
            points.push([xFunc(t, id), yFunc(t, id), zFunc(t, id), wFunc(t, id), t]);

        var error = 0.001; // 1mm 이하의 정확도로 분할! // The smaller the number - the much closer spline should be
        var fittedBeziers = fitCurve(points, error);
        console.log(fittedBeziers);

        dronBeziers[id] = [];

        var x = xFunc(tMin, id);
        var y = yFunc(tMin, id);
        var z = zFunc(tMin, id);
        var w = wFunc(tMin, id); // yaw
        var t = tMin; // time

        for (var j = 0; j < fittedBeziers.length; j++) {
            var cp = fittedBeziers[j];
            var i = cp.length;
            while (--i >= 0) {
                cp[i].x = cp[i][0];
                cp[i].y = cp[i][1];
                cp[i].z = cp[i][2];
                cp[i].w = cp[i][3]; // yaw
                cp[i].t = cp[i][4]; // time
            }

            var d, wFunc = yawFunc;

            // 실제 함수값에 근거해서 각 좌표를 보정한다.
            t = cp[0].t;
            d = cp[0].x - x, cp[0].x -= d, cp[1].x -= d;
            d = cp[0].y - y, cp[0].y -= d, cp[1].y -= d;
            d = cp[0].z - z, cp[0].z -= d, cp[1].z -= d;
            d = cp[0].w - w, cp[0].w -= d, cp[1].w -= d;

            t = cp[3].t;
            d = cp[3].x - xFunc(t, id), cp[3].x -= d, cp[2].x -= d;
            d = cp[3].y - yFunc(t, id), cp[3].y -= d, cp[2].y -= d;
            d = cp[3].z - zFunc(t, id), cp[3].z -= d, cp[2].z -= d;
            d = cp[3].w - wFunc(t, id), cp[3].w -= d, cp[2].w -= d;

            cp = findAvoidingBezier(id, [
                {
                    t: cp[0].t,
                    x: cp[0].x,
                    y: cp[0].y,
                    z: cp[0].z,
                    w: cp[0].w,
                },
                {
                    t: cp[1].t,
                    x: cp[1].x,
                    y: cp[1].y,
                    z: cp[1].z,
                    w: cp[1].w,
                },
                {
                    t: cp[2].t,
                    x: cp[2].x,
                    y: cp[2].y,
                    z: cp[2].z,
                    w: cp[2].w,
                },
                {
                    t: cp[3].t,
                    x: cp[3].x,
                    y: cp[3].y,
                    z: cp[3].z,
                    w: cp[3].w,
                },
            ], fittedBeziers.length == 0);

            dronBeziers[id].push(cp);

            x = cp[3].x;
            y = cp[3].y;
            z = cp[3].z;
            w = cp[3].w;
            t = cp[3].t;
        }
    }
}
