import {
  clearRowsFromTable,
  addRowsToTable,
  setStorage,
  getStorage,
  clearStorage,
} from "./helpers.js";

async function main() {
  let tab_id = parseInt(window.location.search.substring(1));
  let rewards = await getStorage("rewards");
  clearRowsFromTable("loot-table");
  addRowsToTable("loot-table", allRewardsToRow(rewards));
  chrome.debugger.attach({ tabId: tab_id }, "1.0", function (e) {
    chrome.debugger.sendCommand({ tabId: tab_id }, "Network.enable");

    chrome.debugger.onEvent.addListener(function (source, method, params) {
      if (method === "Network.responseReceived") {
        let url = params.response.url;

        if (url.includes("resultmulti/data") || url.includes("result/data")) {
          chrome.debugger.sendCommand(
            { tabId: source.tabId },
            "Network.getResponseBody",
            { requestId: params.requestId },
            function (response) {
              let list = JSON.parse(response.body).rewards.reward_list;
              for (let [_key, value] of Object.entries(list)) {
                for (let [_k, v] of Object.entries(value)) {
                  rewards = addReward(rewards, parseReward(v));
                }
              }
              clearRowsFromTable("loot-table");
              addRowsToTable("loot-table", allRewardsToRow(rewards));
              setStorage("rewards", rewards);
            }
          );
        }
      }
    });
  });
}

function parseReward(reward) {
  let result = {};
  result["name"] = reward["name"];
  result["count"] = reward["count"];
  result["id"] = reward["id"];
  result["rarity"] = reward["rarity"];
  result["type"] = reward["type"];
  return result;
}

function addReward(rewards, new_reward) {
  let result = {};
  let id = new_reward["id"];
  result = JSON.parse(JSON.stringify(rewards));
  result[id] = new_reward;
  if (rewards[id]) {
    result[id]["count"] = (parseInt(rewards[id]["count"]) || 0) + parseInt(new_reward["count"]);
  }
  return result;
}

function allRewardsToRow(rewards) {
  let result = [];
  for (let [_key, value] of Object.entries(rewards)) {
    result.push(rewardToRow(value));
  }
  return result;
}

function rewardToRow(reward) {
  let result = [];
  result.push(
    "<img src='https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img/sp/assets/" +
      reward["type"] +
      "/m/" +
      reward["id"] +
      ".jpg' width='54'></img>"
  );
  result.push(reward["name"]);
  result.push(reward["count"]);
  return result;
}

main();
