require(['AppAPI', 'webview', 'DeviceHandler', 'apiEvents'], function(AppAPI, webview, devhandler, apiEvents) {
        webview.addEventListener('contentload', function() {
            setTimeout(function() {
                AppAPI(JSON.stringify({login:"butov_sales", pass:"sales"}), 'autologin');
                console.log("load ok!");
				chrome.app.window.get("4RPOS").fullscreen();
            }, 3000);
        });
    });
