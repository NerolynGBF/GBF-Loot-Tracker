function clearRowsFromTable(table_id) {
    let table = document.getElementById(table_id);
    while (table.rows.length > 0) {
      table.deleteRow(0);
    }
}

function simplify(str) {
    let result = '', data = str.split('/'),
        numOne = Number(data[0]),
        numTwo = Number(data[1]);
    for (let i = Math.max(numOne, numTwo); i > 1; i--) {
    if ((numOne % i == 0) && (numTwo % i == 0)) {
        numOne /= i;
        numTwo /= i;
    }
    }
    if (numTwo === 1) {
    result = numOne.toString()
    } else {
    result = numOne.toString() + '/' + numTwo.toString()
    }
    return result
}
  
function addRowsToTable(table, array, options = {}) {
    let t = document.getElementById(table) || table;
    let table_id = t.id;
    array.forEach((item, i) => {
        let row = t.insertRow();
        if(options['row-ids']) {
            row.id = options['row-ids'][i];
        }
        if (options['row-classes']) {
            options['row-classes'].forEach((row_class) => {
                row.classList.add(row_class);
            });
        }
        if (options['row-attributes']) {
            for (let [attribute, value] of options['row-attributes']) {
                row.setAttribute(attribute, value);
            }
        }
        if (options['expandable-rows']) {
            row.setAttribute("data-bs-toggle", "collapse");
            row.setAttribute("data-bs-target", "." + table_id + "-" + options['row-ids'][i]);
        }
        item.forEach((value) => {
            let cell = row.insertCell();
            cell.innerHTML = value;
            if (options['cell-classes']) {
                options['cell-classes'].forEach((cell_class) => {
                    cell.classList.add(cell_class);
                });
            }
        });
    });
}

function createTable(table_id, table_header, table_data, options = {}) {
    let new_table = document.createElement('table');
    new_table.id = table_id;
    if (options['table-classes']) {
        options['table-classes'].forEach((table_class) => {
            new_table.classList.add(table_class);
        });
    }
    let header = new_table.createTHead();
    let header_row = header.insertRow();
    let body = new_table.createTBody();
    let body_row = body.insertRow();
    table_header.forEach((item) => {
        let cell = header_row.insertCell();
        cell.innerHTML = item;
    });
    if (options['div-wrapper']) {
        let new_div = document.createElement('div');
        new_div.id = table_id + "-div";
        if (options['div-classes']) {
            options['div-classes'].forEach((div_class) => {
                new_div.classList.add(div_class);
            });
        }
        new_div.appendChild(new_table);
        addRowsToTable(new_table, table_data, options);
        return new_div;
    }
    else {
        addRowsToTable(new_table, table_data, options);
        return new_table;
    }
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

export { clearRowsFromTable, addRowsToTable, setStorage, getStorage, clearStorage, createTable, simplify };