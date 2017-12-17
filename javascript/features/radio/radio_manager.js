// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Manager for the radio feature that's responsible for determining whether and when the radio
// should start playing for players.
class RadioManager {
    constructor(selection, settings) {
        this.selection_ = selection;
        this.settings_ = settings;

        this.listening_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerstatechange', RadioManager.prototype.onPlayerStateChange.bind(this));
    }

    // Returns whether the radio feature should be enabled at all.
    isEnabled() { return this.settings_().getValue('radio/enabled'); }

    // Returns whether the given |player| is listening to the radio right now.
    isListening(player) { return this.listening_.has(player); }

    // ---------------------------------------------------------------------------------------------

    // Called when a player's state has changed. Entering or leaving a vehicle will influence
    // whether the radio has to be started or stopped.
    onPlayerStateChange(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // invalid player

        const isListening = this.listening_.has(player);
        const shouldBeListening = event.newstate == Player.STATE_DRIVER ||
                                  event.newstate == Player.STATE_PASSENGER;

        if (shouldBeListening && !isListening && this.isEnabled())
            this.startRadio(player);
        if (!shouldBeListening && isListening)
            this.stopRadio(player);
    }

    // Starts the radio for the given |player|. Their choice in radio channel, if any at all, will
    // determine what they listen to.
    startRadio(player) {
        const channel = this.getSelectedChannelForPlayer(player);
        if (!channel)
            return;  // the |player| has opted out of the radio feature

        // TODO(Russell): Show some text box thing to tell them about the radio?

        player.playAudioStream(channel.stream);
        this.listening_.add(player);
    }

    // Stops the radio for the given |player| given that they're listening to it.
    stopRadio(player) {
        player.stopAudioStream();
        this.listening_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Determines the channel that the |player| should be listening to. May return NULL if the
    // player has decided to block the radio feature altogether.
    getSelectedChannelForPlayer(player) {
        // TODO(Russell): Enable players to disable the radio feature.
        // TODO(Russell): Enable players to select their own channel preference.

        return this.selection_.defaultChannel;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
    }
}

exports = RadioManager;
