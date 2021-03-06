// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// The account manager keeps track of in-game players and ensures that all information necessary to
// their account is loaded at the appropriate time, and will be securely stored when needed.
export class AccountManager {
    database_ = null;

    constructor(database) {
        this.database_ = database;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerlogin', AccountManager.prototype.onPlayerLoginEvent.bind(this));
        this.callbacks_.addEventListener(
            'playerguestlogin', AccountManager.prototype.onPlayerGuestLoginEvent.bind(this));

        provideNative('SetIsRegistered', 'ii', AccountManager.prototype.setIsRegistered.bind(this));

        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // native SetIsRegistered(playerid, bool: isRegistered);
    //
    // Sets whether the |playerid| is registered, and has to identify to their account prior to
    // being able to interact with the server.
    setIsRegistered(playerid, isRegistered) {
        const player = server.playerManager.getById(playerid);
        if (player)
            player.account.isRegistered_ = !!isRegistered;
        
        return 0;
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager observers
    // ---------------------------------------------------------------------------------------------

    onPlayerConnect(player) {
        // Implement this method when account management completely moves to JavaScript. We have to
        // start loading their profile data, and check whether they're banned or not.
    }

    // Called when a player has identified to their account. Starts to load their account data and
    // make it available to other parts of the server. Invoked as a Pawn event.
    onPlayerLoginEvent(event) { 
        const player = server.playerManager.getById(event.playerid);
        const userId = event.userid;

        if (!player || !userId)
            return;  // either the given player or user Id in the event are invalid.

        this.database_.loadAccountData(userId).then(databaseData => {
            if (!databaseData || !player.isConnected())
                return;  // the |player| has disconnected from the server since

            player.account.initializeFromDatabase(databaseData);

            // Now that the player's account has been initialized, tell the rest of the server.
            server.playerManager.onPlayerLogin(event);
        });
    }

    // Called when a player was asked to identify, but failed to and has been logged in as a guest
    // with a new nickname instead. Invoked as a Pawn event.
    onPlayerGuestLoginEvent(event) {
        const player = server.playerManager.getById(event.playerId);
        if (player)
            server.playerManager.onPlayerNameChange(player, /* update= */ true);
    }

    // Called when the |player| has disconnected from the server.
    onPlayerDisconnect(player) {
        if (!player.account.isIdentified())
            return;  // the |player| was never identified to their account

        // Deliberately do not wait for the save operation to complete.
        this.database_.saveAccountData(player.account.prepareForDatabase());
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        provideNative('SetIsRegistered', 'ii', () => 0);

        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}
