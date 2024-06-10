const functions = require("firebase-functions");
import { collection, doc, setDoc, set } from "firebase/firestore"; 
const admin = require('firebase-admin');
const express = require('express');
import Firebase from 'firebase/compat/app'
const db = Firebase.firestore();
const axios = require('axios');
const app = express();
admin.initializeApp();
/*
 *  Données nécessaires a l'authentification 
 */ 
const merchantId = 'bca22293-85c2-4551-b698-7e563c39b409';
const apiKey = '-!@(hJ';
const clientId = '8h6br6gv41d8pl8csjvnhu5vqud4crr2sq93xqq677a73.apps.vivapayments.com';
const clientSecret = '0RmD9A529r989cQpajK45PWSApT5oW';
const encodedClientCredentials = 'OGg2YnI2Z3Y0MWQ4cGw4Y3Nqdm5odTV2cXVkNGNycjJzcTkzeHFxNjc3YTczLmFwcHMudml2YXBheW1lbnRzLmNvbTowUm1EOUE1MjlyOTg5Y1FwYWpLNDVQV1NBcFQ1b1c='
const scopes = 'urn:viva:payments:core:api:redirectcheckout';
const tokenUrl = 'https://demo-accounts.vivapayments.com/connect/token';
const payLink = 'https://demo.vivapayments.com/web2?ref='
const url = 'https://demo-api.vivapayments.com/checkout/v2/orders'
/*
 *  Fonction payment VivaWallet
 */
exports.VivaWalletPay = functions.firestore.document('/paiments/{documentId}')
    .onCreate((snap, context) => {
        /*
         *   Récupértaion des données du client qui veut payer
         */
    const paiment =  snap.data();
    const amount  = paiment.amount;
    const email  = paiment.email;
    const fullName  = paiment.fullName;
    const phone  = paiment.phone;
    const description  = paiment.description; 
        /*
         *               Getting auth token
         */
        fetch(tokenUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': encodedClientCredentials },
            body: 'grant_type=client_credentials'})
            .then(response => response.json())
            .then(json =>  {
            fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json','Authorization': json.token_type + " " + json.access_token},
                body : JSON.stringify(
                    {
                        amount: 100*amount,
                        customerTrns: description,
                        customer:
                        {
                            email: email,
                            fullName: fullName,
                            phone: phone,
                            countryCode: "FR",
                            requestLang: "fr-FR"
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
                        sourceCode: "1538",
                        merchantTrns: description,
                        tags:[]
                    }
                )
            })
            .then( res => res.json())
            .then(js => {
                // Insertion de l'URL dans le doc
                const payUrl = 'https://demo.vivapayments.com/web/checkout?ref='+js.orderCode+'&color=008000';
                db.collection("paiments").where('phone','==',phone).setDoc({
                    url: payUrl
                })
            })
            .catch(err => {console.log(err);})
        })
});
