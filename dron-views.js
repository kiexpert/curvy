var views = [
    {
        left: 0.2,
        top: 0,
        width: 0.8,
        height: 1.0,
        background: new THREE.Color(0.5, 0.5, 0.7),
        eye: [0, -19, 1.5],
        up: [0, 1, 0],
        fov: 30,
        updateCamera: function (camera, scene, mouseX) {
            //camera.position.x += mouseX * 0.05;
            //camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
            //camera.lookAt( scene.position );
        }
    },
    {
        left: 0.0,
        top: 0.0,
        width: 0.2,
        height: 0.2,
        background: new THREE.Color(0.7, 0.5, 0.5),
        eye: [-9, 0, 1.5],
        up: [0, 0, 1],
        fov: 45,
        updateCamera: function (camera, scene, mouseX) {
            //camera.position.x -= mouseX * 0.05;
            //camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
            //camera.lookAt( camera.position.clone().setY( 0 ) );

        }
    },
    {
        left: 0.0,
        top: 0.2,
        width: 0.2,
        height: 0.2,
        background: new THREE.Color(0.7, 0.5, 0.5),
        eye: [0, -9, 1.5],
        up: [0, 0, 1],
        fov: 45,
        updateCamera: function (camera, scene, mouseX) {
            //camera.position.x -= mouseX * 0.05;
            //camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
            //camera.lookAt( camera.position.clone().setY( 0 ) );

        }
    },
    {
        left: 0.0,
        top: 0.4,
        width: 0.2,
        height: 0.2,
        background: new THREE.Color(0.7, 0.5, 0.5),
        eye: [0, 0, 9],
        up: [0, 1, 0],
        fov: 45,
        updateCamera: function (camera, scene, mouseX) {
            //camera.position.x -= mouseX * 0.05;
            //camera.position.x = Math.max( Math.min( camera.position.x, 2000 ), - 2000 );
            //camera.lookAt( camera.position.clone().setY( 0 ) );

        }
    },
    {
        left: 0.0,
        top: 0.6,
        width: 0.2,
        height: 0.2,
        background: new THREE.Color(0.7, 0.5, 0.5),
        eye: [0, -9, 0],
        up: [0, 1, 0],
        fov: 45,
        updateCamera: function (camera, scene, mouseX) {
            camera.position.x = xFunc(tCurrent, 0);
            camera.position.y = yFunc(tCurrent, 0);
            camera.position.z = zFunc(tCurrent, 0) + 9;

            var yaw = yawFunc(tCurrent, 0);
            camera.up.fromArray([Math.cos(yaw), Math.sin(yaw), 0]);

            var dnpos = camera.position.clone();
            dnpos.z = 0;
            camera.lookAt(dnpos);
        }
    },
    {
        left: 0.0,
        top: 0.8,
        width: 0.2,
        height: 0.2,
        background: new THREE.Color(0.7, 0.5, 0.5),
        eye: [0, -9, 0],
        up: [0, 0, 1],
        fov: 45,
        updateCamera: function (camera, scene, mouseX) {
            camera.position.x = xFunc(tCurrent, 0);
            camera.position.y = yFunc(tCurrent, 0);
            camera.position.z = zFunc(tCurrent, 0);

            //camera.lookAt( camera.position.clone().setY( 0 ) );
            var yaw = yawFunc(tCurrent, 0);
            var fwpos = camera.position.clone();
            camera.position.x -= 9 * Math.cos(yaw);
            camera.position.y -= 9 * Math.sin(yaw);
            camera.lookAt(fwpos);
        }
    }
];

var dronFwCam, dronDnCam;

function initViews(scene)
{
    var ii = views.length, view;
    while (--ii >= 0) {
        view = views[ii];
        camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.fromArray(view.eye);
        camera.up.fromArray(view.up);
        camera.lookAt(scene.position);
        view.camera = camera;
    }
    
    dronFwCam = views[4];
    dronDnCam = views[5];

    window.addEventListener('resize', updateSize, false);
}

var windowWidth, windowHeight;

function resetCamera() {
    // CAMERA
    camera.position.set(2 * xMax, 0.5 * yMax, 4 * zMax);
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(scene.position);
    //scene.add(camera);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    //THREEx.WindowResize(renderer, camera);
}

function updateSize() {
    if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {

        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;

        renderer.setSize(windowWidth, windowHeight);
    }
}

function render() {

    updateSize();

    for (var ii = 0; ii < views.length; ++ii) {
        var view = views[ii];
        var camera = view.camera;

        view.updateCamera(camera, scene, 0, 0);

        var left = Math.floor(windowWidth * view.left);
        var top = Math.floor(windowHeight * view.top);
        var width = Math.floor(windowWidth * view.width);
        var height = Math.floor(windowHeight * view.height);

        renderer.setViewport(left, top, width, height);
        renderer.setScissor(left, top, width, height);
        renderer.enableScissorTest(true);
        renderer.setClearColor(view.background);

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);
    }

}
