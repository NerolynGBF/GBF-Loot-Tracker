let tab_id = parseInt(window.location.search.substring(1))
let rewards = {}
chrome.debugger.attach({ tabId: tab_id }, "1.0", function(e) {
    console.log("Attached!");
    chrome.debugger.sendCommand({ tabId: tab_id }, "Network.enable")
    chrome.debugger.onEvent.addListener(function (source, method, params) {
        if (method === 'Network.responseReceived') {
          let url = params.response.url;
          
          if( 
            url.includes('resultmulti/data') ||
            url.includes('result/data')
          ) {
            console.log('Response received:', params.response);
            chrome.debugger.sendCommand({
              tabId: source.tabId
            }, "Network.getResponseBody", {
              "requestId": params.requestId
            }, function(response) {
              list = JSON.parse(response.body).rewards.reward_list
              for (let [key, value] of Object.entries(list)) {
                for (let [k, v] of Object.entries(value)) {
                  rewards[v['name']] = (rewards[v['name']] || 0) + parseInt(v['count'])
                }
              }
              clearRowsFromTable();
              addRowsToTable(rewards);
            });
          }
        }
    });
  });

  function clearRowsFromTable() {
    let table = document.getElementById("table")
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
  }

function addRowsToTable(rewards) {
    let table = document.getElementById("table")
    for (let [key, value] of Object.entries(rewards)) {
        row = table.insertRow();
        cell = row.insertCell();
        cell.innerHTML=key;
        cell = row.insertCell();
        cell.innerHTML=value;
    }
}