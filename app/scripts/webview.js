define(function() {
    var container = document.getElementById('body');
    var webviewElement = document.createElement('webview');
    webviewElement.id = 'webview';
    webviewElement.src = 'http://pos.4rp.org';
    //webviewElement.src = 'http://localhost:8084/erpCafe/application-start.html';
    //webviewElement.src = 'http://localhost:63342/app/test.html';
    //webviewElement.src = 'http://localhost:63342/app/test_scale.html';
    container.appendChild(webviewElement);
    webviewElement.setAttribute('style', 'position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; width: 100%;  height: 100%; ');
    return webviewElement;
});