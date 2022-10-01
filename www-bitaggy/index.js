import "./styles.scss"
import * as bootstrap from "bootstrap";
import isValidFilename from "valid-filename";

import { DropboxBackend } from "./storage.js";

// import { Universe } from "bitaggy";
import { memory } from "bitaggy/bitaggy_bg";



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

function createElementFromHTML(html) {
    let t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
}


// Ignore all button inputs if any clicking event is being processed.
var clickingInProgress = false;


// Login control.
var backendDropbox = null;
var backendGoogleDrive = null;

var spinnerDropbox = document.getElementById("login-button-dropbox-spinner");
var spinnerGoogleDrive = document.getElementById(
    "login-button-google-drive-spinner");
var checkmarkDropbox = document.getElementById(
    "login-button-dropbox-checkmark");
var checkmarkGoogleDrive = document.getElementById(
    "login-button-google-drive-checkmark");
var crossmarkDropbox = document.getElementById(
    "login-button-dropbox-crossmark");
var crossmarkGoogleDrive = document.getElementById(
    "login-button-google-drive-crossmark");
const allLoginMarks = [spinnerDropbox, spinnerGoogleDrive,
                       checkmarkDropbox, checkmarkGoogleDrive,
                       crossmarkDropbox, crossmarkGoogleDrive];

var indicatorDropbox = document.getElementById("indicator-dropbox");
var indicatorGoogleDrive = document.getElementById("indicator-google-drive");
const allIndicators = [indicatorDropbox, indicatorGoogleDrive];
var indicatorUsername = document.getElementById("indicator-username");

var groupsListTitle = document.getElementById("groups-list-title");
var groupsList = document.getElementById("groups-list");

var deleteMessage = document.getElementById("group-delete-message");
var deleteButton = document.getElementById("group-delete-confirm");
var deleteButtonListener = null;

var editMessage = document.getElementById("group-edit-message");
var editButton = document.getElementById("group-edit-submit");
var editButtonListener = null;
var editInput = document.getElementById("group-edit-input");
var editInputListener = null;

var createMessage = document.getElementById("group-create-message");
var createButton = document.getElementById("group-create-submit");
var createButtonListener = null;
var createInput = document.getElementById("group-create-input");
var createInputListener = null;

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
    let abbrUsername = username.slice(0, 8);
    if (username.length > 8) {
        abbrUsername += "...";
    }
    indicatorUsername.innerText = abbrUsername;
    showElement(indicatorUsername, true);
}

function groupEntryHTML(name, idx) {
    let abbrName = name.slice(0, 16);
    if (name.length > 16) {
        abbrName += "...";
    }
    return `
<a id="group-button-${idx}"
   class="list-group-item list-group-item-action group-button p-2"
   title="${name}" style="cursor: pointer;">
  <div class="row g-0">
    <span id="group-button-icon-${idx}"
          class="col-2 d-flex justify-content-center align-items-center">
      <img src="imgs/folder-open.svg" alt="Group" height="20">
    </span>
    <span id="group-button-name-${idx}"
          class="col-8 d-flex text-left align-items-center">
      &nbsp;${abbrName}
    </span>
    <span class="col-2 d-flex justify-content-center align-items-center">
      <div id="group-button-toolbar-${idx}" class="btn-group">
        <button id="group-button-edit-${idx}" class="btn btn-light p-1"
                data-bs-toggle="modal" data-bs-target="#group-edit-modal"
                title="Rename">
          <img src="imgs/pencil.svg" alt="Edit" height="16">
        </button>
        <button id="group-button-delete-${idx}" class="btn btn-light p-1"
                data-bs-toggle="modal" data-bs-target="#group-delete-modal"
                title="Delete">
          <img src="imgs/trash.svg" alt="Delete" height="16">
        </button>
      </div>
    </span>
  </div>
</a>`;
}

function plusNewEntryHTML() {
    return `
<button type="button" id="group-button-new"
        class="list-group-item list-group-item-action"
        data-bs-toggle="modal" data-bs-target="#group-create-modal"
        title="Create new group">
  <div class="d-flex justify-content-center align-items-center">
    <img src="imgs/folder-plus.svg" alt="Create group" height="20">
  </div>
</button>`;
}

function displayGroupsList(backend, backendName, groups) {
    hideElement(groupsListTitle, true);
    hideElement(groupsList, true);
    groupsList.innerHTML = "";
    
    let idx = 0;
    for (let entry of groups) {
        if (entry[".tag"] == "folder") {
            // fill in groups list HTML content
            const groupButton = createElementFromHTML(groupEntryHTML(
                entry.name, idx));
            groupsList.appendChild(groupButton);

            // event handler on group entry click
            const groupIcon = groupButton.children[0].children[0];
            const groupName = groupButton.children[0].children[1];
            let groupClickFunc = () => {
                console.log(`Entering group ${entry.path_lower}`);
            };
            groupIcon.addEventListener("click", groupClickFunc);
            groupName.addEventListener("click", groupClickFunc);

            // event handler for toolbar buttons
            const toolbar = groupButton.children[0].children[2].children[0];
            const toolbarEdit = toolbar.children[0];
            const toolbarDelete = toolbar.children[1];
            // edit button logic
            toolbarEdit.addEventListener("click", () => {
                // change modal button listener
                if (editButtonListener !== null) {
                    editButton.removeEventListener("click",
                                                   editButtonListener);
                }
                if (editInputListener !== null) {
                    editInput.removeEventListener("keypress",
                                                  editInputListener);
                }
                editButtonListener = () => {
                    // sanitize the input new name
                    let newName = editInput.value.trim();
                    if (!isValidFilename(newName)) {
                        alert(`Rename group failed, '${newName}' is not a `
                              + `valid folder name.`);
                        return;
                    }
                    // asynchronously do renaming
                    showSpinner(backendName);
                    backend.moveFile(entry.path_display,
                                     `/${newName}`).then((success) => {
                        if (!success) {
                            alert("Rename group failed, "
                                  + "please refer to console messages.");
                        }
                        refreshGroupsList(backend, backendName).then(() => {
                            showCheckmark(backendName);
                        });
                    }).catch((e) => {
                        alert("Rename group failed, due to unknown errors.");
                    });
                };
                editButton.addEventListener("click", editButtonListener);
                editInputListener = (event) => {
                    // allow hitting enter key to submit
                    if (event.key === "Enter") {
                        event.preventDefault();
                        editButton.click();
                    }
                };
                editInput.addEventListener("keypress", editInputListener);
                // change modal body text
                editMessage.innerText =
                    `Renaming group '${entry.name}' to:`;
                // clear previous input text
                editInput.value = "";
            });
            // delete button logic
            toolbarDelete.addEventListener("click", () => {
                // change modal button listener
                if (deleteButtonListener !== null) {
                    deleteButton.removeEventListener("click",
                                                     deleteButtonListener);
                }
                deleteButtonListener = () => {
                    // asynchronously do deletion
                    showSpinner(backendName);
                    backend.deleteFile(entry.path_display).then((success) => {
                        if (!success) {
                            alert("Delete group failed, "
                                  + "please refer to console messages.");
                        }
                        refreshGroupsList(backend, backendName).then(() => {
                            showCheckmark(backendName);
                        });
                    }).catch((e) => {
                        alert("Delete group failed, due to unknown errors.");
                    });
                };
                deleteButton.addEventListener("click", deleteButtonListener);
                // change modal body text
                deleteMessage.innerText =
                    `Deleting group '${entry.name}', confirm?`;
            });

            idx += 1;
        }
    }

    // new group entry button
    const groupNewButton = createElementFromHTML(plusNewEntryHTML());
    groupsList.appendChild(groupNewButton);

    // event handler on new group button
    groupNewButton.addEventListener("click", () => {
        // change modal button listener
        if (createButtonListener !== null) {
            createButton.removeEventListener("click", createButtonListener);
        }
        if (createInputListener !== null) {
            createInput.removeEventListener("keypress",
                                            createInputListener);
        }
        createButtonListener = () => {
            // sanitize the input new name
            let newName = createInput.value.trim();
            if (!isValidFilename(newName)) {
                alert(`Create group failed, '${newName}' is not a `
                      + `valid folder name.`);
                return;
            }
            // asynchronously do renaming
            showSpinner(backendName);
            backend.createDirectory(`/${newName}`).then((success) => {
                if (!success) {
                    alert("Create group failed, "
                          + "please refer to console messages.");
                }
                refreshGroupsList(backend, backendName).then(() => {
                    showCheckmark(backendName);
                });
            }).catch((e) => {
                alert("Create group failed, due to unknown errors.");
            });
        };
        createButton.addEventListener("click", createButtonListener);
        createInputListener = (event) => {
            // allow hitting enter key to submit
            if (event.key === "Enter") {
                event.preventDefault();
                createButton.click();
            }
        };
        createInput.addEventListener("keypress", createInputListener);
        // clear previous input text
        createInput.value = "";
    });

    // display groups list section
    showElement(groupsListTitle, true);
    showElement(groupsList, true);
}

async function refreshGroupsList(backend, backendName) {
    let groups = await backend.listDirectory("");
    if (groups !== null) {
        displayGroupsList(backend, backendName, groups);
        // show success checkmark if all these are success
        showCheckmark(backendName);
    } else {
        showCrossmark(backendName);
        alert("Refresh group list failed, please refer to console messages.");
    }
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
                await refreshGroupsList(backend, backendName);
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
loginButtonDropbox.addEventListener("click", () => {
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
        let accessToken = "sl.BQQj5tDVyKuvlz-RH4TRmxAykskmuoa4q7wboePNvDcNHQRXwgWKw9CPde_B5bHbRRRpYBrF3-_ysQhjVWcgfPvdp7SK4wYDs7N5WZjuxZVGo2jtOOzSOaY0GEJPEfNzlH1bJP2nugo";
        loginProcedure("dropbox", backendDropbox, accessToken);

        // re-enable button clicking
        clickingInProgress = false;
    }
});

var loginButtonGoogleDrive = document.getElementById(
    "login-button-google-drive");
loginButtonGoogleDrive.addEventListener("click", () => {

});
