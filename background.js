var sortDomain = 'facebook.com';
var fullDomain = 'https://www.facebook.com/';
var checkedDomain = 'https://m.facebook.com/nearby/search/';

// add listener before check, because while I was debugging the script,
// the alarm usually went off during check() and before the listener was added
// so the check didn't run at all
chrome.alarms.onAlarm.addListener(check);

// listen to message from content script that running in background iframe
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		switch (request.action) {
			case 'restart':
				start();
				break;
			case 'update':
				updateUnread(request.unread);
				break;
			case 'offline':
				offlineButton();
				break;
		}
	}
);

// repair the response header for iframe loading
chrome.webRequest.onHeadersReceived.addListener(
	function (details) {
		for (var i = 0; i < details.responseHeaders.length; i++) {
			var _name = details.responseHeaders[i].name.toLowerCase();
			if (_name === 'x-frame-options' ||  _name === 'frame-options') {
				details.responseHeaders.splice(i, 1);
				return {responseHeaders: details.responseHeaders};
			}
		}
	}, {urls: ["https://m.facebook.com/*"]}, ["blocking", "responseHeaders"]
);

/*
 *  window.onload function
 */
function start(){
	// read user settings
	Interval = (localStorage['ReloadTime']*1||5); // 5 minutes
	Sound = (localStorage['PlayRingtone']!='false');
	Ringtone = new Audio('notify.mp3');
	if (!localStorage['counter']) localStorage['counter'] = '0';

	chrome.alarms.create(
		'reload',
		{
			when:Date.now(),
			periodInMinutes:Interval
		}
	);
}

/*
 *  check if page is already on active tab
 */
function check(){
	chrome.tabs.getSelected(null,function(tab){
		var g=tab.url.indexOf(sortDomain);
		if(g==-1||g>12){ //'facebook.com' may be at most at 13th place: [https://www.f] <- 'c' is 13th char
			var now=new Date();
			chrome.browserAction.setTitle({title:'Connecting ('+now.toLocaleTimeString()+')'});
			reload();
		} else {
			clearButton();
		}
	});
}

/*
 *  reload Facebook page and check/count notifications
 */
function reload(){
	document.getElementById("background-iframe").src = checkedDomain;
}

/*
 *  restore blank button badge and counter=0
 */
function clearButton() {
	chrome.browserAction.setIcon({path:'images/icon.png'});
	chrome.browserAction.setTitle({title:'Online - last changed ('+(new Date()).toLocaleTimeString()+')'});
	chrome.browserAction.setBadgeText({text:''});
	localStorage['counter'] = 0;
}

function updateUnread(count) {
	if(count) {
		var badgeTitle = 'Online - last changed (' + (new Date()).toLocaleTimeString() + ')';
		chrome.browserAction.setIcon({path:'images/icon.png'});
		chrome.browserAction.setTitle({title: badgeTitle});
		chrome.browserAction.setBadgeText({text: '' + count});
		chrome.browserAction.setBadgeBackgroundColor({color: [208, 0, 24, 255]});
		if (Sound && (count>(+localStorage['counter']))) {
			Ringtone.play();
		}
		localStorage['counter'] = count;
	}
	else {
		clearButton();
	}
}

function offlineButton() {
	chrome.browserAction.setIcon({path:'images/icon-offline.png'});
	chrome.browserAction.setTitle({title:'Disconnected ('+(new Date()).toLocaleTimeString()+')'});
	chrome.browserAction.setBadgeBackgroundColor({color:[155,155,155,255]}); //grey
	chrome.browserAction.setBadgeText({text:'?'});
}

/*
 *  button onClick event
 */
chrome.browserAction.onClicked.addListener(function(tab){
	chrome.windows.getAll({populate:true},function(windows){
		for(var i=0;i<windows.length;i++){
			var tabs=windows[i].tabs;
			for(var j=0;j<tabs.length;j++){
				var g=tabs[j].url.indexOf(sortDomain);
				if(g>-1&&g<13){
					chrome.tabs.update(tabs[j].id,{selected:true});
					return;
				}
			}
		}
		chrome.tabs.getSelected(null,function(tab){
			if(tab.url=='chrome://newtab/'){
				chrome.tabs.update(tab.id,{url:fullDomain});
			}
			else {
				chrome.tabs.create({url:fullDomain,selected:true});
			}
		});
	});
});

window.onload=start;