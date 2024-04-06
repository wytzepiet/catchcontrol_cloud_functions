/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { MulticastMessage } from "firebase-admin/lib/messaging/messaging-api";
import { DataSnapshot } from "@firebase/database-types";
import type { AndroidConfig } from "firebase-admin/lib/messaging/messaging-api";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseAuthVariableOverride: {
    auth: {
      uid: "my-service-worker",
    },
  },
});

const registrationTokens = [
  "dGcqkjHZSMapXkKe-IRIBv:APA91bEgDtW0M_KimSNPB-lt2e2O9t5r9y9ABbmHAB9V5LzKGyC99R2RreOQT9dFodh5paxjcAgL2kBTVeGkcEvrhtsqepezr5GJmU2CEjmygZHrqQvdsRN2CixVG_QsQHwNPsVGjU4X",
];

const androidConfig: AndroidConfig = {
  notification: {
    sound: "default",
  },
  priority: "high",
};

const testMessage: MulticastMessage = {
  android: androidConfig,
  notification: {
    title: "Test title from curl",
    body: "Test body from curl",
  },
  tokens: registrationTokens,
};

async function sendMessage(user: DataSnapshot, device: string) {
  const ref = admin.database().ref(`Gebruikers/${user.key}`);

  const fcmToken = (await ref.child("Instellingen/fcmToken").get()).val();
  if (!fcmToken) return;

  const name = (await ref.child(`Apparaten/${device}/Naam`).get()).val();

  console.log("name: " + name);
  const notification = {
    title: "Apparaat geactiveerd",
    body: `${name ?? device} is geactiveerd`,
  };

  admin.messaging().send({
    notification: notification,
    android: androidConfig,
    token: fcmToken,
  });
}

admin
  .messaging()
  .sendEachForMulticast(testMessage)
  .then((response) => {
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(registrationTokens[idx]);
        }
      });
      console.log("List of tokens that caused failures: " + failedTokens);
    }
  })
  .catch((error) => {
    console.log("Error sending message:", error);
  });

exports.onDatabaseValueChange = functions.database
  .ref("Actueel/{device}/State")
  .onUpdate(async (change, context) => {
    // Get the updated value
    const device = context.params.device;
    const database = admin.database();

    const users = await database.ref(`Actueel/${device}/Users`).get();

    console.log("device: " + device);

    admin
      .messaging()
      .sendEachForMulticast(testMessage)
      .then((response) => {
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(registrationTokens[idx]);
            }
          });
          console.log("List of tokens that caused failures: " + failedTokens);
        }
      })
      .catch((error) => {
        console.log("Error sending message:", error);
      });

    users.forEach((user) => {
      sendMessage(user, device);
    });

    const newValue = change.after.val();

    // Perform your desired action here
    console.log("Value has changed:", newValue);

    // Return a promise to indicate that the function has completed
    return Promise.resolve();
  });
