import {
  clearRowsFromTable,
  addRowsToTable,
  setStorage,
  getStorage,
  createTable,
  simplify
} from "./helpers.js";

async function main() {
  let tab_id = parseInt(window.location.search.substring(1));
  let rewards = await getStorage("rewards");
  let raid_history = await getStorage("raid_history");
  let raid_dict = await getStorage("raid_dict");
  let requests = [];
  clearRowsFromTable("loot-table");
  addRowsToTable("loot-table", allRewardsToRow(rewards));
  buildRaidTable(raid_history);
  chrome.debugger.attach({ tabId: tab_id }, "1.0", function (e) {
    chrome.debugger.sendCommand({ tabId: tab_id }, "Network.enable");
    chrome.debugger.onEvent.addListener(function (source, method, params) {
      if (method === "Network.responseReceived") {
        requests.push({
          requestId: params.requestId,
          url: params.response.url
        });
      }
      else if (method === "Network.loadingFinished") {
        let url = requests.find((x) => x.requestId === params.requestId).url;
        let new_rewards = [];
        let name = "";
        let blue_chested = false;
        if (url.includes("rest/multiraid/start.json")) {
          chrome.debugger.sendCommand(
            { tabId: source.tabId },
            "Network.getResponseBody",
            { requestId: params.requestId },
            function (response) {
              if (response !== undefined) {
                let twitter = JSON.parse(response.body)["twitter"];
                raid_dict[twitter["raid_id"]] = { name: twitter["monster"], raid_id: twitter["raid_id"], enemy_id: twitter["enemy_id"] };
                setStorage("raid_dict", raid_dict)
              }
            });
        }
        else if (url.includes("resultmulti/data") || url.includes("result/data") || url.includes("resultmulti/") || url.includes("result/content")) {
          const regex = /(?!\/)\d+(?=\?)/gm;
          let raid_id = url.match(regex)[0];
          chrome.debugger.sendCommand(
            { tabId: source.tabId },
            "Network.getResponseBody",
            { requestId: params.requestId },
            function (response) {
              if (response !== undefined) {
                
                let body = JSON.parse(response.body).option;
                let list = body.result_data.rewards.reward_list;
                let retry_quest_info = body.result_data.retry_quest_info;
                if (retry_quest_info && url.includes("result/content")) {
                  name = retry_quest_info["chapter_name"];
                  raid_dict[raid_id] = { name: retry_quest_info["chapter_name"], raid_id: raid_id, enemy_id: retry_quest_info["quest_id"] };
                  setStorage("raid_dict", raid_dict)
                }
                else if (raid_dict[raid_id]) {
                  name = raid_dict[raid_id].name;
                }

                for (let [key, value] of Object.entries(list)) {
                  if (key == "11" && !Array.isArray(value)) {
                    blue_chested = true;
                  }
                  for (let [_k, v] of Object.entries(value)) {
                    new_rewards.push(parseReward(v));
                  }
                }
                
                rewards = addRewards(rewards, new_rewards);
                clearRowsFromTable("loot-table");
                addRowsToTable("loot-table", allRewardsToRow(rewards));
                setStorage("rewards", rewards);
                if(name!="") {
                  if (!raid_history[name]) {
                    raid_history[name] = {};
                    raid_history[name]['rewards'] = {};
                    raid_history[name]['kill_count'] = 0;
                    raid_history[name]['blue_chest_count'] = 0;
                    raid_history[name]['enemy_id'] = raid_dict[raid_id]['enemy_id'];
                  }
                  raid_history[name]['rewards'] = addRewards(raid_history[name]['rewards'], new_rewards);
                  raid_history[name]['kill_count']+=1;
                  if ( blue_chested ) { raid_history[name]['blue_chest_count']+=1 };
                  clearRowsFromTable("raid-table");
                  buildRaidTable(raid_history);
                  delete raid_dict[raid_id];
                  setStorage("raid_history", raid_history);
                  setStorage("raid_dict", raid_dict)
                }
              }
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
  result["count"] = parseInt(reward["count"]);
  result["id"] = reward["id"];
  result["rarity"] = reward["rarity"];
  result["type"] = reward["type"];
  if (reward["thumbnail_img"]) {
    result["thumbnail_img"] = reward["thumbnail_img"];
  }
  return result;
}

function buildRaidTable(raid_history){
  addRowsToTable("raid-table", allRaidsToRow(raid_history), { "expandable-rows": true, "row-classes": ['accordion-toggle'], "row-ids": Object.values(raid_history).map((x) => x['enemy_id']) });
  for (let [key, value] of Object.entries(raid_history)) {
    let raid_table = document.getElementById("raid-table");
    let table = createTable(
      "raid-table-" + value['enemy_id'],
      ["Image", "Name", "Count", "Per Blue Chest", "Per Raid"],
      allRewardsToRow(value['rewards'], { "include-stats": true, "raid-count": value['kill_count'], "blue-chest-count": value['blue_chest_count'] }),
      { 
        "table-classes": ["w-100", "table-sm"],
        "div-wrapper": true,
        "div-classes": ["accordion", "collapse", "raid-table-" + value['enemy_id']],
        "row-classes": ["raid-table-" + value['enemy_id']],
      }
    );
    let new_tr = raid_table.insertRow(document.getElementById(value['enemy_id']).rowIndex);
    new_tr.classList.add("raid-table-" + value['enemy_id'], "collapse");
    let new_td = new_tr.insertCell()
    new_td.setAttribute("colspan", "3");
    new_td.appendChild(table);
  };
}

function addRewards(rewards, new_rewards) {
  let result = {};
  let id = "";
  result = JSON.parse(JSON.stringify(rewards || {}));
  new_rewards.forEach((reward) => {
    id = reward["id"];
    if (result[id]) {
      result[id]["count"] = (parseInt(result[id]["count"]) || 0) + parseInt(reward["count"]);
      if (reward["thumbnail_img"]) {
        result[id]["thumbnail_img"] = reward["thumbnail_img"];
      }
    }
    else {
      result[id] = reward;
    }
  });
  return result;
}

function allRewardsToRow(rewards, options = {}) {
  let result = [];
  for (let [_key, value] of Object.entries(rewards)) {
    result.push(rewardToRow(value, options));
  }
  return result;
}

function allRaidsToRow(raids) {
  let result = [];
  for (let [key, value] of Object.entries(raids)) {
    result.push(raidToRow(key, value));
  }
  return result;
}

function rewardToRow(reward, options = {}) {
  let result = [];
  result.push(
    "<img src='https://prd-game-a1-granbluefantasy.akamaized.net/assets_en/img/sp/assets/" +
      reward["type"] +
      "/m/" +
      (reward["thumbnail_img"] || reward["id"]) +
      ".jpg' width='54'></img>"
  );
  result.push(reward["name"]);
  result.push(reward["count"]);
  if (options["include-stats"]) {
    result.push((options["blue-chest-count"] > 0) ? simplify((reward["count"]+"/"+options["blue-chest-count"])) : "N/A")
    result.push((options["raid-count"] > 0) ? simplify((reward["count"]+"/"+options["raid-count"])) : "N/A")
  }
  return result;
}

function raidToRow(name, data) {
  let result = [];
  result.push(name);
  result.push(data["blue_chest_count"]);
  result.push(data["kill_count"]);
  return result;
}

main();
