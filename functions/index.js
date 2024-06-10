const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
import fetch from "node-fetch";

/*
 *  Données nécessaires a l'authentification
 */
const c = "8h6br6gv41d8pl8csjvnhu5vqud4crr2sq93xqq677a73.apps.vivapayments.com";
const cS = "0RmD9A529r989cQpajK45PWSApT5oW";
const clientAccess = c + ":" + cS;
const encodedCC = "Basic " + Buffer.from(clientAccess).toString("base64");
const retTransactionUrl =
  "https://demo-api.vivapayments.com/checkout/v2/transactions/";
const tokenUrl = "https://demo-accounts.vivapayments.com/connect/token";
const payLink = "https://demo.vivapayments.com/web2?ref=";
const url = "https://demo-api.vivapayments.com/checkout/v2/orders";
/*
 *  Fonction payment VivaWallet
 */
exports.VivaWalletPay = functions.https.onCall(async (data, context) => {
  if (!data.paiement || !context.auth) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Miss request body",
    );
  }
  /*
   *   Récupértaion des données du client qui veut payer
   */
  const paiment = data.paiement;
  const amount = paiment.amount;
  const email = paiment.email;
  const fullName = paiment.fullName;
  const phone = paiment.phone;
  const description = paiment.description;
  /*
   *               Getting auth token
   */
  fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": encodedCC,
    },
    body: "grant_type=client_credentials",
  })
      .then((response) => response.json())
      .then((json) => {
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": json.token_type + " " + json.access_token,
          },
          body: JSON.stringify({
            amount: 100 * amount,
            customerTrns: description,
            customer: {
              email: email,
              fullName: fullName,
              phone: phone,
              countryCode: "FR",
              requestLang: "fr-FR",
            },
            paymentTimeout: 600, // 10 mins
            preauth: false,
            allowRecurring: false,
            maxInstallments: 0,
            paymentNotification: false,
            tipAmount: 0,
            disableExactAmount: false,
            disableCash: true,
            disableWallet: true,
            sourceCode: "6271",
            merchantTrns: description,
            tags: [],
          }),
        })
            .then((res) => res.json())
            .then((js) => {
              const payUrl = payLink + js.orderCode + "&color=AAFF00";
              return payUrl;
            })
            .catch((err) => {
              console.log(err);
            });
      });
});
// récupération de transaction
// récupération de transaction
// récupération de transaction
// récupération de transaction
exports.VerifyPayment = functions.https.onCall(async (data, context) => {
  if (!data.urlTrans || !context.auth) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Miss request body",
    );
  }
  /*
   *   Récupértaion de la ref de transaction
   */
  // var urlTransaction = "https://demo.vivapayments.com/web/checkout/result?t=37125b6e-9858-41f6-82b2-3f1ce956a515&s=3529039574239507&lang=fr-FR&eventId=0&eci=2";
  const urlTransaction = data.urlTrans;
  const firstTerm = "t=";
  const lastTerm = "&s=";
  const index1 = urlTransaction.indexOf(firstTerm);
  const index2 = urlTransaction.indexOf(lastTerm);
  const ref = urlTransaction.substr(index1 + 2, index2 - index1 - 2);
  const URL = retTransactionUrl + ref;
  /*
   *               Getting auth token
   */
  fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": encodedCC,
    },
    body: "grant_type=client_credentials",
  })
      .then((response) => response.json())
      .then((json) => {
        fetch(URL, {
          method: "GET",
          headers: {Authorization: json.token_type + " " + json.access_token},
        })
            .then((res) => res.json())
            .then((js) => {
              if (js.statusId == "F") {
                // console.log('true');
                return true;
              } else {
                // console.log('false');
                return false;
              }
            })
            .catch((err) => {
              console.log(err);
            });
      });
});
