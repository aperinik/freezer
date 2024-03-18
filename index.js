const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

var admin = require("firebase-admin");

var serviceAccount = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

async function getUsers() {
    const data = await db.collection('user').get();
    data.forEach((user) => {
        console.log(user.data())
    });
}

getUsers();