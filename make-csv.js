
// export the path to csv file and download.
function path_csv() {
    var xFunc = Parser.parse(xFuncText).toJSFunction(['t', 'i']);
    var yFunc = Parser.parse(yFuncText).toJSFunction(['t', 'i']);
    var zFunc = Parser.parse(zFuncText).toJSFunction(['t', 'i']);
    var yawFunc = Parser.parse(yawFuncText).toJSFunction(['t', 'i']);
    var csv = 't,x,y,z,yaw\r\n'
    for (var t = tMin; t <= tMax; t += 1 / timeDivs/*Math.pow(10, timeDivs)*/) {
        csv += t;
        csv += ',' + xFunc(t, 0);
        csv += ',' + yFunc(t, 0);
        csv += ',' + zFunc(t, 0);
        csv += ',' + yawFunc(t, 0);
        csv += '\r\n';
    }
    return csv;
}

// export the trajectory to csv file and download.
function traj_csv() {
    var xFunc = Parser.parse(xFuncText).toJSFunction(['t', 'i']);
    var yFunc = Parser.parse(yFuncText).toJSFunction(['t', 'i']);
    var zFunc = Parser.parse(zFuncText).toJSFunction(['t', 'i']);
    var yawFunc = Parser.parse(yawFuncText).toJSFunction(['t', 'i']);
    var dt = 1 / timeDivs;//Math.pow(10, timeDivs);
    var points = [];//[[0, 0], [10, 10], [10, 0], [20, 0]];
    var timeps = [];

    for (var t = tMin; t <= tMax; t += dt)
        points.push([xFunc(t, 0), yFunc(t, 0), zFunc(t, 0), yawFunc(t, 0), t]);

    var error = 0.001; // 1mm 이하의 정확도로 분할! // The smaller the number - the much closer spline should be
    var fittedBeziers = fitCurve(points, error);
    console.log(fittedBeziers);

    var csv = "Duration,x^0,x^1,x^2,x^3,x^4,x^5,x^6,x^7,y^0,y^1,y^2,y^3,y^4,y^5,y^6,y^7,z^0,z^1,z^2,z^3,z^4,z^5,z^6,z^7,yaw^0,yaw^1,yaw^2,yaw^3,yaw^4,yaw^5,yaw^6,yaw^7\r\n";

    for (var t = tMin; fittedBeziers.length > 0;) {
        var cp = fittedBeziers.shift();
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
        d = cp[0].x - xFunc(t, 0), cp[0].x -= d, cp[1].x -= d;
        d = cp[0].y - yFunc(t, 0), cp[0].y -= d, cp[1].y -= d;
        d = cp[0].z - zFunc(t, 0), cp[0].z -= d, cp[1].z -= d;
        d = cp[0].w - wFunc(t, 0), cp[0].w -= d, cp[1].w -= d;

        t = cp[3].t;
        d = cp[3].x - xFunc(t, 0), cp[3].x -= d, cp[2].x -= d;
        d = cp[3].y - yFunc(t, 0), cp[3].y -= d, cp[2].y -= d;
        d = cp[3].z - zFunc(t, 0), cp[3].z -= d, cp[2].z -= d;
        d = cp[3].w - wFunc(t, 0), cp[3].w -= d, cp[2].w -= d;

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

        var prec = 9;
        csv += (cp[3].t - cp[0].t).toFixed(prec);
        csv += ',' + cp[0].x.toFixed(prec) + ',' + cx.toFixed(prec) + ',' + bx.toFixed(prec) + ',' + ax.toFixed(prec) + ',0,0,0,0';
        csv += ',' + cp[0].y.toFixed(prec) + ',' + cy.toFixed(prec) + ',' + by.toFixed(prec) + ',' + ay.toFixed(prec) + ',0,0,0,0';
        csv += ',' + cp[0].z.toFixed(prec) + ',' + cz.toFixed(prec) + ',' + bz.toFixed(prec) + ',' + az.toFixed(prec) + ',0,0,0,0';
        csv += ',' + cp[0].w.toFixed(prec) + ',' + cw.toFixed(prec) + ',' + bw.toFixed(prec) + ',' + aw.toFixed(prec) + ',0,0,0,0';
        csv += '\r\n';

        t = cp[3].t;
    }

    return csv;
}

function exportPathCSV() {
    var link = $("<a></a>");
    var csv = path_csv();
    link.attr('href', 'data:application/csv;charset=utf-8,'
        + encodeURIComponent(csv));
    link.attr('download', 'path.csv');
    link.attr('target', '_blank');
    link[0].click();
}

function exportTrajCSV() {
    var link = $("<a></a>");
    var csv = traj_csv();
    link.attr('href', 'data:application/csv;charset=utf-8,'
        + encodeURIComponent(csv));
    link.attr('download', 'bezier.csv');
    link.attr('target', '_blank');
    link[0].click();
}
