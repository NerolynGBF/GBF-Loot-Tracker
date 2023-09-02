const WINDOW_VERTICAL = { height: 978, width: 768 };
const WINDOW_HORIZONTAL = { height: 978, width: 768 }

chrome.action.onClicked.addListener(function (tab) {
  chrome.windows.create(Object.assign({ url: "public.html?" + tab.id, type: "popup" }, WINDOW_HORIZONTAL));
  
});

let isHorizontal = true;
chrome.runtime.onMessage.addListener(
  function (msg) {
    if (!msg || !msg.type) {
      return;
    }
    switch (msg.type) {
      case ('msg_resize'):
        chrome.windows.getCurrent(function (w) {
          const size = isHorizontal ? WINDOW_VERTICAL : WINDOW_HORIZONTAL;
          chrome.windows.update(w.id, size);
          isHorizontal = !isHorizontal;
        });
        break;
      case ('msg_link'):
        if (msg.data && msg.data.url) {
          chrome.tabs.create({ url: msg.data.url });
        }
        break;
      case('msg_request'):
        chrome.windows.getCurrent(function (w) {
          // change table in window with request info
          w.alert(msg.data);
        });
      default:
        break;
    }
  });