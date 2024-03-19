const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const prompt = require("prompt-sync")({ sigint: true });
var fs = require('fs');

var admin = require("firebase-admin");

let output = prompt("Seleziona percorso e nome file di output (vuoto per default: ./data.* ): ");
if (!output) {
    output = "./data";
}

let keypath = prompt("Seleziona percorso della key Firestore (vuoto per default: ./key.json): ");
if (!keypath) {
    keypath = "./key.json";
}

try{
    var serviceAccount = require(keypath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
catch(e){
    console.log("Chiave non valida");
    process.exit();
}


const db = getFirestore();

/* Recupera tutti gli utenti */
async function getUsers() {
    let data = await db.collection('user').get();

    let users = []
    data.forEach(async (user) => {
        users.push({ 'nome': user.data().nome, 'email': user.data().email, 'id_user': user.id })
    });
    return users;
}

/* Recupera tutti i freezer di un dato utente */
async function getFreezers(id_user) {
    let data = await db.collection('freezer').where('id_user', '==', id_user).get();

    let freezers = [];
    data.forEach(async (freezer) => {
        freezers.push({ 'nomeFreezer': freezer.data().nomeFreezer, 'id_freezer': freezer.id })
    });
    return freezers;
}

/* Recupera il cibo contenuto in un dato freezer */
async function getFood(id_freezer) {
    let data = await db.collection('freezer/' + id_freezer + '/food').get();

    let foodArray = [];
    data.forEach(async (food) => {
        foodArray.push(food.data().nomeAlimento)
    });
    return foodArray;
}

/* Crea il file csv */
function generateCSV(data) {
    /* Intestazione -  email, freezer, cibo */
    const head = 'email, freezer, cibo;\n';
    let csv = head;
    for (let user of data) {
        /* Scrivi utenti */
        csv = csv.concat(user.email + ', , ;\n');
        for (let freezer of user.freezers) {
            /* Scrivi freezer per ogni utente alla seconda colonna */
            csv = csv.concat('-, ' + freezer.nomeFreezer + ', ;\n');
            for (let food of freezer.food) {
                /* Scrivi cibo per ogni freezer alla terza colonna */
                csv = csv.concat('-,-, ' + food + ';\n')
            }
        }
    }

    /* Genera il file */
    fs.writeFile(output+'.csv', csv, 'utf8', () => {
        console.log('File CSV creato');
    });
}

async function main() {
    let users = await getUsers();
    /* Per ogni utente prendi i rispettivi freezer */
    for (let user of users) {
        let freezers = await getFreezers(user.id_user);
        /* Per ogni freezer prendi il rispettivo cibo */
        for (let freezer of freezers) {
            let food = await getFood(freezer.id_freezer);
            /* Incorpora il cibo all'oggetto freezer */
            freezer.food = food;
        }
        /* Incorpora il freezer all'oggetto user */
        user.freezers = freezers;
    }

    try{
        /* Genera JSON */
        fs.writeFile(output+'.json', JSON.stringify(users, null, 2), 'utf8', () => {
            console.log('File JSON creato');
        });
        /* Genera CSV */
        generateCSV(users);
    }
    catch(e){
        console.log("Errore nella creazione dei file");
        process.exit();
    }

}

main();