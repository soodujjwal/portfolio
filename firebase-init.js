import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBlWrvQsp_vPv2klYEpkIRqPKnm3kEJUM",
  authDomain: "portfolio-ea5b2.firebaseapp.com",
  projectId: "portfolio-ea5b2",
  storageBucket: "portfolio-ea5b2.firebasestorage.app",
  messagingSenderId: "64277628647",
  appId: "1:64277628647:web:2d7538b451b66430070442",
  measurementId: "G-T1BNLLWLH3",
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
