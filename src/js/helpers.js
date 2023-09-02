function clearRowsFromTable(table_id) {
    let table = document.getElementById(table_id);
    while (table.rows.length > 1) {
      table.deleteRow(1);
    }
}
  
function addRowsToTable(table_id, array) {
    let table = document.getElementById(table_id);
    array.forEach((item) => {
        let row = table.insertRow();
        item.forEach((value) => {
            let cell = row.insertCell();
            cell.innerHTML = value;
        });
    });
}

function setStorage(key, value) {
    chrome.storage.local.set({ [key]: value });
}

const getStorage = async (key) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
        if (result[key] === undefined) {
            resolve({})
        } else {
            resolve(result[key]);
        }
        });
    });
};
  
const clearStorage = async () => {
    chrome.storage.local.clear();
}

export { clearRowsFromTable, addRowsToTable, setStorage, getStorage, clearStorage };