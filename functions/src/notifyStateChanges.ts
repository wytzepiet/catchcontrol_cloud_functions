/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { DataSnapshot } from "@firebase/database-types";

async function sendMessage(user: DataSnapshot, device: string) {
  const ref = await admin.database().ref(`Gebruikers/${user.key}`).get();

  const messagingTokens = ref.child("Instellingen/MessagingTokens");

  const name = ref.child(`Apparaten/${device}/Naam`).val() ?? device;

  messagingTokens.forEach((fcmToken) => {
    admin
      .messaging()
      .send({
        notification: {
          title: "Apparaat geactiveerd",
          body: `${name} is geactiveerd`,
        },
        android: {
          notification: {
            sound: "default",
          },
          priority: "high",
        },
        token: fcmToken.key ?? "",
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });
  });
}

const notifyStateChanges = functions.database
  .ref("Actueel/{device}/State")
  .onUpdate(async (status, context) => {
    if (status.after.val() != 1) return;

    const device = context.params.device;
    const users = await admin.database().ref(`Actueel/${device}/Users`).get();

    users.forEach((user) => {
      sendMessage(user, device);
    });

    // Return a promise to indicate that the function has completed
    return Promise.resolve();
  });

export default notifyStateChanges;
