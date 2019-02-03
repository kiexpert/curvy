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
    if (id == 0)
        return new TrjBezier(cp);
    var LL = safeDistance * 0.01; LL *= LL; // 안전거리의 제곱...
    var LL4 = LL * 4; // 안전거리 두배의 제곱...

    var i = dronBeziers.length, tbc;
    var workCnt = 0;
    var avx = 0, avy = 0, avz = 0, avc = 0; // avoiding vector sum...
    var xx, yy, zz;
    var ctm32 = 0; // collide time mask
    var t0 = cp[0].t, tEnd = cp[3].t;

    while (--i >= 0) {
        var tba = dronBeziers[i];
        if (tba.length <= 0)
            continue;

        var j = tba.length, tbz = null;
        while(--j >= 0) {
            tbz = tba[j];
            if (tbz.t0 == t0 && tbz.t1 >= tEnd )
                break;
        }
        if (j < 0) continue;

        // find collision & avoidance...
        tbc = new TrjBezier(cp);
        var t = t0, dt = Math.min(0.01, (tEnd - t) / 32.0);
        for(; t <= tEnd; t += dt) {
            tbc.iter(t);
            tbz.iter(t);
            xx = tbc.x - tbz.x, xx *= xx;
            yy = tbc.y - tbz.y, yy *= yy;
            zz = tbc.z - tbz.z, zz *= zz * 0.25; // z축은 더 강조??
            if(xx + yy + zz > LL4) continue;

            // 안전거리 두배 이내에 진입...
            var avs = Math.sqrt(xx + yy + zz);
            if (avs) {
                // merge avoiding vector...
                avs = 1.0 / avs;
                avx += (tbc.x - tbz.x) * avs;
                avy += (tbc.y - tbz.y) * avs;
                avz += (tbc.z - tbz.z) * avs;
            }
            avc++;
            if(xx + yy + zz > LL) continue;

            // found collision...
            // 안전거리 이내에 진입...
            workCnt++;
            var cmsh = (t - t0) * 31 / (tEnd - t0) | 0;
            ctm32 |= 1 << cmsh;

            //tEnd = t; // 다음 드론의 확인 범위 줄이기...
            break;
        }
        if(i > 0) continue;
        if(workCnt == 0)
            return tbc;

        // avoidance...
        // 진행 방향에서 조금 회전된 안전거리 크기의 벡터를 구한다.
        var cs = Math.cos(3.14 / 180 * -90);
        var sn = Math.sin(3.14 / 180 * -90);
        var cx = cp[3].x - cp[0].x;
        var cy = cp[3].y - cp[0].y;
        var ls = safeDistance * 0.01 / Math.sqrt(cx*cx + cy*cy);
        cx *= ls;
        cy *= ls;
        var dx = cx * cs - cy * sn;
        var dy = cx * sn + cy * cs;

        // TODO: optimize with avoiding vector
        //avc = safeDistance * 0.01 / avc;
        //dx += avx * avc;
        //dy += avy * avc;

        // 컨트롤 포인트 두개와 목표 앵커점을 회전된 벡터만큼 밀어준다.
        if(ctm32 & 0xffffffff) cp[1].x += dx, cp[1].y += dy;
        if(ctm32 & 0xffffffff) cp[2].x += dx, cp[2].y += dy;
        if(ctm32 & 0xffffffff) cp[3].x += dx, cp[3].y += dy;

        // 시작점이 충돌하는 경우는 시작점도 밀어준다.
        if(dronBeziers[id].length==0)
            cp[0].x += dx, cp[0].y += dy;

        // 처음부터 다시 확인!
        i = dronBeziers.length;
        workCnt = ctm32 = 0;
        avx = avy = avz = avc = 0;
        tEnd = cp[3].t;
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
