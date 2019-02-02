var dronBeziers;

function TrjBezier(bezier)
{
    var cp = this.cp = bezier;
    // http://blog.naver.com/kyuniitale/40022945907
    var ax, bx, cx, ay, by, cy, az, bz, cz, aw, bw, cw;

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
    var t0 = this.t0 = cp[0].t, tw = (this.t1 = cp[3].t) - t0, ts = 1.0 / tw;

    /* 매개변수 값 t에서 곡선 점을 계산한다 */
    var self = this;
    this.iter = function(rt) {
        self.t = rt;
        var t = (rt - t0) * ts;
        var tSquared = t * t;
        var tCubed = tSquared * t;
        self.x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x;
        self.y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y;
        self.z = (az * tCubed) + (bz * tSquared) + (cz * t) + cp[0].z;
        self.w = (aw * tCubed) + (bw * tSquared) + (cw * t) + cp[0].w;
        return self;
    };
    this.iter0to1 = function(t) {
        this.t = t * tw + t0;
        var tSquared = t * t;
        var tCubed = tSquared * t;
        self.x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x;
        self.y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y;
        self.z = (az * tCubed) + (bz * tSquared) + (cz * t) + cp[0].z;
        self.w = (aw * tCubed) + (bw * tSquared) + (cw * t) + cp[0].w;
        return self;
    };
    this.iter0to1(0);
}

function findSafeBezier(id, cp, fin) {
    return new TrjBezier(cp);
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
    return new TrjBezier(cp);
}

function makeBeziers() {
    var wFunc = yawFunc;
    var dt = Math.max(0.01, (tMax - tMin) * 1.0 / timeDivs);//Math.pow(10, timeDivs);

    var id = 0, t;
    dronBeziers = [];

    for (; id < numDrones; id++) {
        var points = [];
        for(t = tMin; t <= tMax; t += dt)
            points.push([xFunc(t, id), yFunc(t, id), zFunc(t, id), wFunc(t, id), t]);

        var fittedBeziers = fitCurve(points, fitError);
        //console.log(fittedBeziers);

        dronBeziers[id] = [];

        t = tMin; // time
        var x = xFunc(t, id);
        var y = yFunc(t, id);
        var z = zFunc(t, id);
        var w = wFunc(t, id); // yaw

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

            var d;

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

            var tbz = findSafeBezier(id, cp, fittedBeziers.length == 0);

            dronBeziers[id].push(tbz);

            tbz.iter0to1(1);
            x = tbz.x;
            y = tbz.y;
            z = tbz.z;
            w = tbz.w;

            continue;
            if (x != cp[3].x) console.log("anchor2.x mismatch!!! " + x + " != " + cp[3].x);
            if (y != cp[3].y) console.log("anchor2.y mismatch!!! " + y + " != " + cp[3].y);
            if (z != cp[3].z) console.log("anchor2.z mismatch!!! " + z + " != " + cp[3].z);
            if (w != cp[3].w) console.log("anchor2.w mismatch!!! " + w + " != " + cp[3].w);
        }
    }

    return dronBeziers;
}
