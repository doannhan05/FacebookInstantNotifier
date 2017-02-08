function read(el) {
    var sett = localStorage[el.name];
    if (sett) {
        sett = ( sett == 'true' ? true : (sett == 'false' ? false : sett) );

        if (el.type == 'checkbox') {
            el.checked = sett;
        }
        else if (el.type == 'text') {
            el.value = sett;
        }
    }
}

function save() {
    if (this.type == 'checkbox') {
        localStorage[this.name] = this.checked ? true : false;
    } else if (this.type == 'text') {
        if (this.name == 'ReloadTime') {
            localStorage[this.name] = this.value.replace(/,/, '.').replace(/[^\.\d]/g, '').replace(/(\d+(?:\.(?:\d+)?)?).*/, '$1')*1;
        } else {
            localStorage[this.name] = this.value;
        }
    }
    
    // restart background process
    chrome.runtime.sendMessage({action: "restart"}, function(response) {});
}

function options() {
    var a = document.getElementsByTagName('input');
    for (var i = 0; i < a.length; i++) {
        a[i].addEventListener((a[i].type == 'checkbox' ? 'click' : 'input'), save, false);
        read(a[i]);
    }
}

window.onload = options;