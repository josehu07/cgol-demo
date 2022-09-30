import "./styles.scss"
import * as bootstrap from "bootstrap";

// import { Universe } from "bitaggy";
import { memory } from "bitaggy/bitaggy_bg";

import { DropboxBackend } from "./storage.js";


// Helper functions.
function showElement(element, onVisibility = false) {
    if (onVisibility) {
        element.classList.remove("invisible");
    } else {
        element.classList.remove("d-none");
    }
}

function hideElement(element, onVisibility = false) {
    if (onVisibility) {
        element.classList.add("invisible");
    } else {
        element.classList.add("d-none");
    }
}

function hideElements(elements) {
    for (let e of elements) {
        hideElement(e);
    }
}


// Ignore all button inputs if any clicking event is being processed.
var clickingInProgress = false;


// Login control.
var backendDropbox = null;
var backendGoogleDrive = null;

let spinnerDropbox = document.getElementById("login-button-dropbox-spinner");
let spinnerGoogleDrive = document.getElementById(
    "login-button-google-drive-spinner");
let checkmarkDropbox = document.getElementById(
    "login-button-dropbox-checkmark");
let checkmarkGoogleDrive = document.getElementById(
    "login-button-google-drive-checkmark");
let crossmarkDropbox = document.getElementById(
    "login-button-dropbox-crossmark");
let crossmarkGoogleDrive = document.getElementById(
    "login-button-google-drive-crossmark");
const allLoginMarks = [spinnerDropbox, spinnerGoogleDrive,
                       checkmarkDropbox, checkmarkGoogleDrive,
                       crossmarkDropbox, crossmarkGoogleDrive];

let indicatorDropbox = document.getElementById("indicator-dropbox");
let indicatorGoogleDrive = document.getElementById("indicator-google-drive");
const allIndicators = [indicatorDropbox, indicatorGoogleDrive];
let indicatorUsername = document.getElementById("indicator-username");

let groupsList = document.getElementById("groups-list");

function showSpinner(backendName) {
    hideElements(allLoginMarks);
    if (backendName == "dropbox") {
        showElement(spinnerDropbox);
    } else if (backendName == "google-drive") {
        showElement(spinnerGoogleDrive);
    }
}

function showCheckmark(backendName) {
    hideElements(allLoginMarks);
    if (backendName == "dropbox") {
        showElement(checkmarkDropbox);
    } else if (backendName == "google-drive") {
        showElement(checkmarkGoogleDrive);
    }
}

function showCrossmark(backendName) {
    hideElements(allLoginMarks);
    if (backendName == "dropbox") {
        showElement(crossmarkDropbox);
    } else if (backendName == "google-drive") {
        showElement(crossmarkGoogleDrive);
    }
}

function showUsername(backendName, username) {
    hideElements(allIndicators);
    hideElement(indicatorUsername, true);
    if (backendName == "dropbox") {
        showElement(indicatorDropbox);
        indicatorDropbox.title = `Dropbox Account: ${username}`;
        indicatorUsername.title = `Dropbox Account: ${username}`;
    } else if (backendName == "google-drive") {
        showElement(indicatorGoogleDrive);
        indicatorGoogleDrive.title = `Google Drive Account: ${username}`;
        indicatorUsername.title = `Google Drive Account: ${username}`;
    }
    indicatorUsername.innerText = username;
    showElement(indicatorUsername, true);
}

function groupEntryHTML(name) {
    return `<button type="button" class="list-group-item list-group-item-action" title="${name}">${name}</button>`;
}

async function loginProcedure(backendName, backend, accessToken) {
    try {
        // show login spinner
        showSpinner(backendName);

        // wait on login reply
        let success = await backend.login(accessToken);
        if (success) {
            // get and show navbar username
            let username = await backend.getUsername();
            if (username !== null) {
                showUsername(backendName, username);
                // fetch groups list and display
                let groups = await backend.listDirectory("");
                if (groups !== null) {
                    groupsList.innerHTML = "";
                    for (let entry of groups) {
                        if (entry[".tag"] == "folder") {
                            groupsList.innerHTML += groupEntryHTML(entry.name);
                        }
                    }
                    // show success checkmark if all these are success
                    showCheckmark(backendName);
                } else {
                    showCrossmark(backendName);
                    alert("Login failed, please refer to console messages.");
                }
            } else {
                showCrossmark(backendName);
                alert("Login failed, please refer to console messages.");
            }
        } else {
            showCrossmark(backendName);
            alert("Login failed, please refer to console messages.");
        }
    } catch (e) {
        console.error(`Unknown login error: ${e}`);
        showCrossmark(backendName);
        alert("Login failed, due to unknown errors.");
        
    }

}

var loginButtonDropbox = document.getElementById("login-button-dropbox");
loginButtonDropbox.addEventListener("click", (event) => {
    if (!clickingInProgress) {
        clickingInProgress = true;
        
        // instantiate a DropboxBackend and attempt login if haven't
        if (backendDropbox === null) {
            backendDropbox = new DropboxBackend();
        } else if (backendDropbox.loggedIn) {
            // already logged in, do nothing
            clickingInProgress = false;
            return;
        }
        
        // perform login procedure
        let accessToken = "sl.BQM56_GGdH1CBto1wNbQ5Eo54pwhw4o3hbDXS2TsCjdJ6FAdUe7Sh0d3VBnI2mxAlvVDfS8l1WXD1QM8_vRLzpKavpgebU5yhbySLBFKLGejAtfaTBZ1yY8x_pWR4e96PIUQDTg";
        loginProcedure("dropbox", backendDropbox, accessToken);

        // re-enable button clicking
        clickingInProgress = false;
    }
});

var loginButtonGoogleDrive = document.getElementById(
    "login-button-google-drive");
loginButtonGoogleDrive.addEventListener("click", (event) => {

});
