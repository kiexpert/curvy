
if(File && FileReader && FileList && Blob) {
	document.getElementById("pathCsvFile").onchange = function () {
		var file = this.files[0];
		var name = file.name;
		var size = file.size;
		var reader = new FileReader();

		reader.onload = function () {
			var csv = this.result + '';
			//infoElm.innerText = csv;

			var lines = csv.replace(/\r+|\r\n\r|\s+$/g, '').split('\n');
			var fields = lines.shift().split(',');
			var ts=[], xs=[], ys=[], zs=[], ws=[];
			var i = -1, t0 = Math.floor(lines[0].split(',')[0] * 100) / 100;
			var tc = t0 >= 50 && Math.floor(t0) == t0 ? 100*0.001 : 100;
			while(++i < lines.length) {
				var sar = lines[i].split(',');
				ts[i] = Math.floor((sar[0] - t0) * tc) * 0.01;
				xs[i] = parseFloat(sar[1]);
				ys[i] = parseFloat(sar[2]);
				zs[i] = parseFloat(sar[3]);
				if (sar.length > 4)
					ws[i] = parseFloat(sar[4]);
			}

			autoUpdate = false;
			gui_tMin.setValue( tMin = ts[0] );
            gui_tMax.setValue( tMax = ts[ts.length - 1] );
            gui_numDrones.setValue( 1 );

			ts.push(tMax);

			var iLast = 0, tLast = tMin;
			function t2i(t) {
				if(t < ts[1])
					return tLast = tMin, iLast = 0;
				if(t >= tMax)
					return tLast = tMax, iLast = ts.length - 1;

				// 이진 탐색...
				var t2 = Math.floor(t * 100) / 100;
				// TODO: iLast를 이용한 검색속도 최적화...
				if(tLast <= t2) {
					if(t2 < ts[iLast+1])
						return iLast;
				}

				var lo = 0, hi = lines.length - 1, mi, mt;
				do {
					mt = ts[ mi = (lo + hi) >> 1 ];
					if (mt <= t2 && t2 < ts[ mi + 1 ])
						return tLast = t2, iLast = mi;
					if (mt < t2)
						lo = mi + 1;
					else
						hi = mi - 1;
				} while(lo <= hi);

				//console.log("time not found! t="+t+", t2="+t2+", hi="+hi+", lo="+lo+", mi="+mi);
				return tLast = t2, iLast = hi;
			}

			// TODO: 보간 처리...
			xFunc	= function(t,i) {
				//console.log(t, t2i(t), xs[t2i(t)]);
				return xs[t2i(t)];
			};
			yFunc	= function(t,i) {
				return ys[t2i(t)];
			};
			zFunc	= function(t,i) {
				return zs[t2i(t)];
			};
			yawFunc = function(t,i) {
				return ws[t2i(t)];
			};

			var dronBezigers = makeBeziers();
		    updateGraph(dronBeziers, tMax);
		};

		reader.readAsText(file);
	};
}
