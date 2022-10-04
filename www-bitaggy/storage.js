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
     * Gets the username on storage backend.
     * @returns user name string on success, otherwise null
     */
    async getUsername() {
        console.log(`StorageBackend: getting current username`);
        return null;
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
     * Creates the directory at path.
     * @param path full path string
     * @returns true on success, otherwise false
     */
    async createDirectory(path) {
        console.log(`StorageBackend: creating folder ${path}`);
        return false;
    }

    /**
     * Deletes the file/directory at path.
     * @param path full path string
     * @returns true on success, otherwise false
     */
    async deleteFile(path) {
        console.log(`StorageBackend: deleting folder ${path}`);
        return false;
    }

    /**
     * Moves the file/directory at source path to destination path.
     * @param src_path full source path string
     * @param dst_path full destination path string
     * @returns true on success, otherwise false
     */
    async moveFile(src_path, dst_path) {
        console.log(`StorageBackend: moving ${src_path} to ${dst_path}`);
        return false;
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
     * Creates the directory at path.
     * @param path full path string
     * @returns true on success, otherwise false
     */
    async createDirectory(path) {
        if (this.dbx === null) {
            console.error(`Dropbox: not logged in yet`);
            return false;
        }

        try {
            let response = await this.dbx.filesCreateFolderV2(
                { path: path, autorename: false });
            if (response.status == 200) {
                return true;
            }
            return false;
        } catch (e) {
            console.error(`Dropbox: failed to create folder ${path}`);
            return false;
        }
    }

    /**
     * Deletes the file/directory at path.
     * @param path full path string
     * @returns true on success, otherwise false
     */
    async deleteFile(path) {
        if (this.dbx === null) {
            console.error(`Dropbox: not logged in yet`);
            return false;
        }

        try {
            let response = await this.dbx.filesDeleteV2({ path: path });
            if (response.status == 200) {
                return true;
            }
            return false;
        } catch (e) {
            console.error(`Dropbox: failed to delete file ${path}`);
            return false;
        }
    }

    /**
     * Moves the file/directory at source path to destination path.
     * @param src_path full source path string
     * @param dst_path full destination path string
     * @returns true on success, otherwise false
     */
    async moveFile(src_path, dst_path) {
        if (this.dbx === null) {
            console.error(`Dropbox: not logged in yet`);
            return false;
        }

        try {
            let response = await this.dbx.filesMoveV2(
                { from_path: src_path, to_path: dst_path,
                  autorename: false });
            if (response.status == 200) {
                return true;
            }
            return false;
        } catch (e) {
            console.error(
                `Dropbox: failed to move ${src_path} to ${dst_path}`);
            return false;
        }
    }
}


// Google Drive storage backend.
export class GoogleDriveBackend extends StorageBackend {
    /**
     * Constructs a Google Drive storage backend handle.
     * @constructor
     */
    constructor() {
        super();
    }
}
