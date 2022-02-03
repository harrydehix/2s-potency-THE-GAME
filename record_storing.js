const fs = require("fs/promises");

async function getRecords(recordsFilePath) {
    try {
        return JSON.parse(await fs.readFile(recordsFilePath, "utf8"));
    } catch (err) {
        await fs.writeFile(recordsFilePath, JSON.stringify([]));
        return [];
    }
}

function updateRecords(records, potentialRecord) {
    records.push(potentialRecord);
    records.sort((a, b) => {
        return b.score - a.score;
    });
    return records.slice(0, 10);
}

async function storeRecords(recordsFilePath, records) {
    try {
        await fs.writeFile(recordsFilePath, JSON.stringify(records));
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    getRecords,
    updateRecords,
    storeRecords,
};
