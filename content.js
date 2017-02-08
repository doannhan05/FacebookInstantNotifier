var frameLoadingTime = 5000;
var countDelayingTime = 2000;

function inIframe () {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

if (inIframe()) {
    window.setTimeout(function () {
        var notificationBar = document.querySelector('#header[data-sigil="MTopBlueBarHeader"]');
        if(notificationBar) {
            countUnread();

            var countProcess; // process of counting when DOM notification bar change

            // observe the DOM change
            var observer = new MutationObserver(function (mutations) {
                if(countProcess){
                    clearTimeout(countProcess);
                }
                countProcess = window.setTimeout(countUnread, countDelayingTime);
            });

            var config = {childList: true, attributes: true, characterData: true, subtree: true};
            observer.observe(notificationBar, config);
        }
        else {
            // Facebook page not logged in
            chrome.runtime.sendMessage({action: "offline"});
        }
    }, frameLoadingTime);
}

function countUnread() {
    var count = 0;

    var requestElem = document.querySelector('#requests_jewel span[data-sigil="count"]');
    if (requestElem) {
        count += parseInt(requestElem.innerText);
    }

    var messageElem = document.querySelector('#messages_jewel span[data-sigil="count"]');
    if (messageElem) {
        count += parseInt(messageElem.innerText);
    }

    var notificationElem = document.querySelector('#notifications_jewel span[data-sigil="count"]');
    if (notificationElem) {
        count += parseInt(notificationElem.innerText);
    }

    // send update unread count command to background process
    chrome.runtime.sendMessage({action: "update", unread: count});
}