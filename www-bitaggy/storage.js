import { Dropbox } from "dropbox";


// Debugging utilities.
const sleep = (delay_ms) => new Promise((resolve) => setTimeout(resolve, delay));


// Parent class of storage backends.
class StorageBackend {
    loggedIn = false;

    /**
     * Constructs a storage backend handle.
     * @constructor
     */
    constructor() {
        this.loggedIn = false;
    }

    /**
     * Logs in with given access token.
     * @param accessToken user access token string
     * @returns true on success, otherwise false
     */
    async login(accessToken) {
        console.log(`StorageBackend: logging in with ${accessToken}`);
        return false;
    }

    /**
     * Lists the directory at path.
     * @param path full path string
     * @returns an Array of entries on success, otherwise null
     */
    async listDirectory(path) {
        console.log(`StorageBackend: listing directory at ${path}`);
        return null;
    }

    /**
     * Gets the username on storage backend.
     * @returns user name string on success, otherwise null
     */
    async getUsername() {
        console.log(`StorageBackend: getting current username`);
        return null;
    }
}


// Dropbox storage backend.
export class DropboxBackend extends StorageBackend {
    static echoString = "dropboxEchoMessage";

    dbx = null;

    /**
     * Constructs a Dropbox storage backend handle.
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Logs in with given access token.
     * @param accessToken user access token string
     * @returns true on success, otherwise false
     */
    async login(accessToken) {
        this.dbx = new Dropbox({ accessToken: accessToken });
        let response;

        // check Dropbox App status
        // try {
        //     response = await this.dbx.checkApp(
        //         { query: DropboxBackend.echoString });
        //     if (response.status != 200 ||
        //         response.result.result != DropboxBackend.echoString) {
        //         console.error(`Dropbox: app status check failed: mismatch`);
        //         return false;
        //     }
        // } catch (e) {
        //     console.error(`Dropbox: app status check failed: ${e}`);
        //     return false;
        // }

        // validate user access token
        try {
            response = await this.dbx.checkUser(
                { query: DropboxBackend.echoString });
            if (response.status != 200 ||
                response.result.result != DropboxBackend.echoString) {
                console.error(
                    `Dropbox: access token validation failed: mismatch`);
                return false;
            }
        } catch (e) {
            console.error(`Dropbox: access token validation failed: ${e}`);
            return false;
        }

        this.loggedIn = true;
        return true;
    }

    /**
     * Lists the directory at path.
     * @param path full path string
     * @returns an Array of entries on success, otherwise null
     */
    async listDirectory(path) {
        if (this.dbx === null) {
            console.error(`Dropbox: not logged in yet`);
            return null;
        }

        try {
            let entries = Array();
            let response = await this.dbx.filesListFolder({ path: path });
            if (response.status == 200) {
                entries.push(...response.result.entries);
            }

            // might have more entries requiring Continues
            while (response.status == 200 && response.result.has_more) {
                let cursor = response.result.cursor;
                response = await this.dbx.filesListFolderContinue(
                    { cursor: cursor });
                entries.push(...response.result.entries);
            }
            
            return entries;

        } catch (e) {
            console.error(`Dropbox: error listing directory ${path}: ${e}`);
            return null;
        }
    }

    /**
     * Gets the username on storage backend.
     * @returns user name string on success, otherwise null
     */
     async getUsername() {
        if (this.dbx === null) {
            console.error(`Dropbox: not logged in yet`);
            return null;
        }

        try {
            let response = await this.dbx.usersGetCurrentAccount();
            return response.result.name.display_name;
        } catch (e) {
            console.error(`Dropbox: error getting current username: ${e}`);
            return null;
        }

        return null;
    }
}
