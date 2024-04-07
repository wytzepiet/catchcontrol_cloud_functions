/* eslint-disable require-jsdoc */
import * as admin from "firebase-admin";
import notifyStateChanges from "./notifyStateChanges";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL:
    "https://vk-controller-default-rtdb.europe-west1.firebasedatabase.app/",
  // databaseAuthVariableOverride: {
  //   auth: {
  //     uid: "my-service-worker",
  //   },
  // },
});

exports.notifyStateChanges = notifyStateChanges;
