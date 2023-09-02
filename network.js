async function main() {
  let tab_id = parseInt(window.location.search.substring(1));
  let rewards = await getStorage("rewards");
  clearRowsFromTable("table")
  addRowsToTable("table", rewards)
  chrome.debugger.attach({ tabId: tab_id }, "1.0", function (e) {
    chrome.debugger.sendCommand({ tabId: tab_id }, "Network.enable");
    chrome.debugger.onEvent.addListener(function (source, method, params) {
      if (method === "Network.responseReceived") {
        let url = params.response.url;

        if (url.includes("resultmulti/data") || url.includes("result/data")) {
          chrome.debugger.sendCommand(
            {
              tabId: source.tabId,
            },
            "Network.getResponseBody",
            {
              requestId: params.requestId,
            },
            function (response) {
              list = JSON.parse(response.body).rewards.reward_list;
              for (let [key, value] of Object.entries(list)) {
                for (let [k, v] of Object.entries(value)) {
                  rewards[v["name"]] =
                    (rewards[v["name"]] || 0) + parseInt(v["count"]);
                }
              }
              clearRowsFromTable("table")
              addRowsToTable("table", rewards)
              setStorage("rewards", rewards)
              console.log(getStorage("rewards"))
            }
          );
        }
      }
    });
  });
}

function clearRowsFromTable(table_id) {
  let table = document.getElementById(table_id);
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
}

function addRowsToTable(table_id, data) {
  let table = document.getElementById(table_id);
  for (let [key, value] of Object.entries(data)) {
    row = table.insertRow();
    if (value === Array) {
      value.forEach (v => {
        cell = row.insertCell();
        cell.innerHTML = v;
      })
    }
    else {
      cell = row.insertCell();
      cell.innerHTML = key;
      cell = row.insertCell();
      cell.innerHTML = value;
    }
  }
}

function setStorage(key, value) {
  console.log(key, value)
  chrome.storage.local.set({ [key]: value });
}

const getStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
        reject();
      } else {
        resolve(result[key]);
      }
    });
  });
};

function clearStorage() {
  chrome.storage.local.clear();
}

main();