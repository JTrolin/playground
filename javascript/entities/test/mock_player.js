// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPlayerSyncedData from 'entities/test/mock_player_synced_data.js';
import MockVehicle from 'entities/test/mock_vehicle.js';
import PlayerSettings from 'entities/player_settings.js';
import { Vector } from 'base/vector.js';

import { murmur3hash } from 'base/murmur3hash.js';

// Player (mock)
//
// Implementation of the Player interface that specifically exists to enable running tests on the
// server because the Player does not actually exist. No Pawn calls will be made. Additional
// functionality has been added for testing purposes, to allow for modifications and inspection
// that would otherwise be infeasible.
class MockPlayer {
    #id_ = null;
    #connectionState_ = null; // remove

    #name_ = null;
    #gpci_ = null;
    #serial_ = null;
    #packetLossPercentage_ = 0;
    #ping_ = 30;
    #ipAddress_ = null;
    #isNpc_ = null;

    #isServerAdmin_ = false;

    #position_ = new Vector(0, 0, 0);
    #rotation_ = 0;
    #interiorId_ = 0;
    #virtualWorld_ = 0;
    #velocity_ = new Vector(0, 0, 0);

    #color_ = Color.WHITE;
    #health_ = 100.0;
    #armour_ = 100.0;
    #skin_ = 308;  // San Fierro Paramedic (EMT)
    #specialAction_ = Player.kSpecialActionNone;
    #state_ = Player.kStateOnFoot;
    #isMinimized_ = false;

    #drunkLevel_ = 0;
    #fightingStyle_ = Player.kFightingStyleNormal;
    #score_ = 0;
    #team_ = 255;  // NO_TEAM
    #time_ = [0, 0];
    #wantedLevel_ = 0;

    #messages_ = [];
    #lastDialogId_ = null;
    #lastDialogTitle_ = null;
    #lastDialogStyle_ = null;
    #lastDialogLabel_ = null;
    #lastDialogMessage_ = null;
    #lastDialogPromise_ = null;
    #lastDialogPromiseResolve_ = null;

    #streamUrl_ = null;
    #soundId_ = null;

    #vehicle_ = null;
    #vehicleSeat_ = null;
    #isSurfingVehicle_ = false;

    // Initializes the mock player with static information that generally will not change for the
    // duration of the player's session. The |params| object is available.
    initialize(params) {
        this.#connectionState_ = Player.kConnectionEstablished;  // remove

        this.#name_ = params.name || 'Player' + this.#id_;
        this.#gpci_ = params.gpci || 'FAKELONGHASHOF40CHARACTERSHEH';
        this.#serial_ = murmur3hash(this.#gpci_ || 'npc');
        this.#ipAddress_ = params.ip || '127.0.0.1';
        this.#isNpc_ = params.npc || false;

        this.#lastDialogPromiseResolve_ = null;
        this.#lastDialogPromise_ = new Promise(resolve => {
            this.#lastDialogPromiseResolve_ = resolve;
        });
    }

    notifyDisconnecting() { this.#connectionState_ = Player.kConnectionClosing; }
    notifyDisconnected() { this.#connectionState_ = Player.kConnectionClosed; }

    // ---------------------------------------------------------------------------------------------
    // Section: Identity
    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    get name() { return this.#name_; }
    set name(value) { this.#name_ = value; }

    get ip() { return this.#ipAddress_; }

    get gpci() { return this.#gpci_; }
  
    get serial() { return this.#serial_; }

    get packetLossPercentage() { return this.#packetLossPercentage_; }
    set packetLossPercentageForTesting(value) { this.#packetLossPercentage_ = value; }

    get ping() { return this.#ping_; }
    set pingForTesting(value) { this.#ping_ = value; }

    isServerAdmin() { return this.#isServerAdmin_; }
    setServerAdminForTesting(value) { this.#isServerAdmin_ = value; }

    // remove
    isConnected() {
        return this.#connectionState_ === Player.kConnectionEstablished ||
               this.#connectionState_ === Player.kConnectionClosing;
    }

    // remove
    isDisconnecting() {
        return this.#connectionState_ === Player.kConnectionClosing;
    }

    isNonPlayerCharacter() { return this.#isNpc_; }

    kick() { this.disconnectForTesting(/* reason= */ 2); }

    setNameForGuestLogin(value) { this.#name_ = value; }

    disconnectForTesting(reason = 0) {
        dispatchEvent('playerdisconnect', {
            playerid: this.#id_,
            reason: reason
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Physics
    // ---------------------------------------------------------------------------------------------

    get position() { return this.#position_; }
    set position(value) {
        this.#position_ = value;

        // Testing behaviour: using SetPlayerPos() while the player is in a vehicle will eject them
        // from the vehicle. Emulate this behaviour by issuing a state change event.
        if (this.#vehicle_ !== null) {
            dispatchEvent('playerstatechange', {
                playerid: this.#id_,
                oldstate: this.#vehicleSeat_ == Vehicle.SEAT_DRIVER ? Player.kStateVehicleDriver
                                                                    : Player.kStateVehiclePassenger,
                newstate: Player.kStateOnFoot,
            });

            this.#vehicle_ = null;
            this.#vehicleSeat_ = null;
        }

        // Testing behaviour: players moving around will naturally cause them to be near pickups,
        // which are events that aren't naturally generated in a test setup. Fake it.
        server.pickupManager.onPlayerPositionChanged(this);
    }

    get rotation() { return this.#rotation_; }
    set rotation(value) { this.#rotation_ = value; }

    get velocity() { return this.#velocity_; }
    set velocity(value) { this.#velocity_ = value; }

    get interiorId() { return this.#interiorId_; }
    set interiorId(value) { this.#interiorId_ = value; }

    get virtualWorld() { return this.#virtualWorld_; }
    set virtualWorld(value) {
        if (this.syncedData_.isIsolated())
            return;

        this.#virtualWorld_ = value;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: State
    // ---------------------------------------------------------------------------------------------

    get color() { return this.#color_; }
    set color(value) { this.#color_ = value; }

    get health() { return this.#health_; }
    set health(value) { this.#health_ = value; }

    get armour() { return this.#armour_; }
    set armour(value) { this.#armour_ = value; }

    get controllable() { throw new Error('Unable to get whether the player is controllable.'); }
    set controllable(value) { /* no need to mock write-only values */ }

    get skin() { return this.#skin_; }
    set skin(value) { this.#skin_ = value; }

    get specialAction() { return this.#specialAction_; }
    set specialAction(value) { this.#specialAction_ = value; }

    get state() { return this.#state_; }
    set stateForTesting(value) { this.#state_ = value; }

    isMinimized() { return this.#isMinimized_; }
    setMinimizedForTesting(value) { this.#isMinimized_ = value; }

    respawn() {
        let defaultPrevented = false;

        // Testing behaviour: returns whether another part of Las Venturas Playground is handling
        // the spawn, which is indicated by them preventing the event's default behaviour.
        dispatchEvent('playerspawn', {
            preventDefault: () => defaultPrevented = true,
            playerid: this.#id_
        });

        return defaultPrevented;
    }

    // ---------------------------------------------------------------------------------------------
    // Section: Environment
    // ---------------------------------------------------------------------------------------------

    get drunkLevel() { return this.#drunkLevel_; }
    set drunkLevel(value) { this.#drunkLevel_ = value; }

    get fightingStyle() { return this.#fightingStyle_; }
    set fightingStyle(value) { this.#fightingStyle_ = value; }

    get score() { return this.#score_; }
    set score(value) { this.#score_ = value; }

    get team() { return this.#team_; }
    set team(value) { this.#team_ = value; }

    get time() { return this.#time_; }
    set time(value) { this.#time_ = value; }

    get wantedLevel() { return this.#wantedLevel_; }
    set wantedLevel(value) { this.#wantedLevel_ = value; }

    get weather() { throw new Error('Unable to get the current weather for players.'); }
    set weather(value) { /* no need to mock write-only values */ }

    // ---------------------------------------------------------------------------------------------
    // Section: Interaction
    // ---------------------------------------------------------------------------------------------

    showDialog(dialogId, style, caption, message, leftButton, rightButton) {
        this.#lastDialogId_ = dialogId;
        this.#lastDialogTitle_ = caption;
        this.#lastDialogStyle_ = style;
        this.#lastDialogLabel_ = rightButton;
        this.#lastDialogMessage_ = message;

        this.#lastDialogPromiseResolve_();
    }

    // Gets the most recent message that has been displayed in a dialog to the player.
    get lastDialog() { return this.#lastDialogMessage_; }
    get lastDialogTitle() { return this.#lastDialogTitle_; }
    get lastDialogStyle() { return this.#lastDialogStyle_; }
    get lastDialogLabel() { return this.#lastDialogLabel_; }

    // Advanced method to get the last dialog as a menu table.
    getLastDialogAsTable(hasColumns = true) {
        if (!this.#lastDialogMessage_)
            throw new Error('No last message is available to output as a table.');
        
        const lines = this.#lastDialogMessage_.split('\n');
        if (!hasColumns)
            return lines;

        return {
            columns: lines.shift().split('\t'),
            rows: lines.map(line => line.split('\t'))
        };
    }

    // Clears the last dialog that has been shown to this player.
    clearLastDialog() {
        this.#lastDialogId_ = null;
        this.#lastDialogTitle_ = null;
        this.#lastDialogStyle_ = null;
        this.#lastDialogLabel_ = null;
        this.#lastDialogMessage_ = null;
    }

    // Sends |message| to the player. It will be stored in the local messages array and can be
    // retrieved through the |messages| getter.
    sendMessage(message, ...args) {
        if (message instanceof Message)
            message = Message.format(message, ...args);

        if (message.length <= 144) // SA-MP-implementation does not send longer messages
            this.#messages_.push(message.toString());
    }

    // Clears the messages that have been sent to this player.
    clearMessages() { this.#messages_ = []; }

    // Gets the messages that have been sent to this player.
    get messages() { return this.#messages_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Audio
    // ---------------------------------------------------------------------------------------------

    playAudioStream(url) { this.#streamUrl_ = url; }

    playSound(soundId) { this.#soundId_ = soundId; }

    stopAudioStream() { this.#streamUrl_ = null; }

    get soundIdForTesting() { return this.#soundId_; }
    get streamUrlForTesting() { return this.#streamUrl_; }

    // ---------------------------------------------------------------------------------------------
    // Section: Visual
    // ---------------------------------------------------------------------------------------------

    animate(options) {}

    get animationIndex() { return 0; }

    clearAnimations() {}

    get cameraPosition() { return new Vector(0, 0, 0); }
    get cameraFrontVector() { return new Vector(0, 0, 0); }

    interpolateCamera(positionFrom, positionTo, targetFrom, targetTo, duration) {}

    resetCamera() {}

    setCamera(position, target) {}

    setSpectating(value) {}

    // ---------------------------------------------------------------------------------------------
    // Section: Vehicles
    // ---------------------------------------------------------------------------------------------

    get vehicle() { return this.#vehicle_; }
    set vehicle(value) { this.#vehicle_ = value; }
  
    get vehicleSeat() { return this.#vehicleSeat_; }
    set vehicleSeat(value) { this.#vehicleSeat_ = value; }

    get vehicleCollisionsEnabled() { throw new Error('Unable to read this setting.'); }
    set vehicleCollisionsEnabled(value) { /* no need to mock write-only values */ }

    enterVehicle(vehicle, seat = 0) {
        this.#vehicle_ = vehicle;
        this.#vehicleSeat_ = seat;

        dispatchEvent('playerstatechange', {
            playerid: this.#id_,
            oldstate: Player.kStateOnFoot,
            newstate: seat === 0 ? Player.kStateVehicleDriver
                                 : Player.kStateVehiclePassenger
        });
    }

    isSurfingVehicle() { return this.#isSurfingVehicle_; }
    setSurfingVehicleForTesting(value) { this.#isSurfingVehicle_ = value; }

    leaveVehicle() { this.position = this.position; }  // remove
    leaveVehicleWithAnimation() { this.leaveVehicle(); }

    // ---------------------------------------------------------------------------------------------
    // Stuff that needs a better home
    // ---------------------------------------------------------------------------------------------


    // ---------------------------------------------------------------------------------------------
    // Instrumentation for testing purposes
    // ---------------------------------------------------------------------------------------------

    // Identifies the player to a fake account. The options can be specified optionally.
    identify({ userId = 42, vip = 0, gangId = 0, undercover = 0 } = {}) {
        server.playerManager.onPlayerLogin({
            playerid: this.#id_,
            userid: userId,
            vip: vip,
            gangid: gangId,
            undercover: undercover
        });
    }

    // Issues |message| as if it has been said by this user. Returns whether the event with which
    // the chat message had been issues was prevented.
    issueMessage(message) {
        let defaultPrevented = false;

        dispatchEvent('playertext', {
            preventDefault: () => defaultPrevented = true,

            playerid: this.#id_,
            text: message
        });

        return defaultPrevented;
    }

    // Issues |commandText| as if it had been send by this player. Returns whether the event with
    // which the command had been issued was prevented.
    async issueCommand(commandText) {
        let defaultPrevented = false;

        await server.commandManager.onPlayerCommandText({
            preventDefault: () => defaultPrevented = true,

            playerid: this.#id_,
            cmdtext: commandText
        });

        return defaultPrevented;
    }

    // Responds to an upcoming dialog with the given values. The dialog Id that has been shown
    // for the player will be inserted automatically. Responses are forcefully asynchronous.
    respondToDialog({ response = 1 /* left button */, listitem = 0, inputtext = '' } = {}) {
        return this.#lastDialogPromise_.then(() => {
            dispatchEvent('dialogresponse', {
                playerid: this.#id_,
                dialogid: this.#lastDialogId_,
                response: response,
                listitem: listitem,
                inputtext: inputtext
            });

            return this.#lastDialogPromise_ = new Promise(resolve => {
                this.#lastDialogPromiseResolve_ = resolve;
            });
        });
    }

    // Changes the player's state from |oldState| to |newState|.
    changeState({ oldState, newState } = {}) {
        dispatchEvent('playerstatechange', {
            playerid: this.#id_,
            oldstate: oldState,
            newstate: newState
        });
    }

    // Triggers an event indicating that the player died.
    die(killerPlayer = null, reason = 0) {
        dispatchEvent('playerdeath', {
            playerid: this.#id_,
            killerid: killerPlayer ? killerPlayer.id
                                   : Player.kInvalidId,
            reason: reason
        });
    }

    // Makes this player fire a shot. All related events will be fired. The |target| may either be
    // a Player or a Vehicle instance, or NULL when the shot didn't hit anything.
    shoot({ target = null, weaponid = 28 /* Uzi */, hitOffset = null, damageAmount = null,
            bodypart = 3 /* BODY_PART_CHEST */ } = {}) {
        let hitType = 0 /* BULLET_HIT_TYPE_NONE */;

        if (target instanceof MockPlayer)
            hitType = 1 /* BULLET_HIT_TYPE_PLAYER */;
        else if (target instanceof MockVehicle)
            hitType = 2 /* BULLET_HIT_TYPE_VEHICLE */;

        hitOffset = hitOffset || new Vector(5, 5, 2);

        dispatchEvent('playerweaponshot', {
            playerid: this.#id_,
            weaponid: weaponid,
            hittype: hitType,
            hitid: target ? target.id : -1,
            fX: hitOffset.x,
            fY: hitOffset.y,
            fZ: hitOffset.z
        });

        if (!(target instanceof MockPlayer))
            return;

        let damage = damageAmount || Math.floor(Math.random() * 100) + 10;

        dispatchEvent('playergivedamage', {
            playerid: this.#id_,
            damagedid: target.id,
            amount: damage,
            weaponid: weaponid,
            bodypart: bodypart
        });

        dispatchEvent('playertakedamage', {
            playerid: target.id,
            issuerid: this.#id_,
            amount: damage,
            weaponid: weaponid,
            bodypart: bodypart
        });
    }

    // Makes this player press a particular key. The value of both |newkeys| and |oldkeys| can be
    // found on the SA-MP wiki: https://wiki.sa-mp.com/wiki/Keys
    keyPress(newkeys, oldkeys = 0) {
        dispatchEvent('playerkeystatechange', {
            playerid: this.#id_,
            newkeys: newkeys,
            oldkeys: oldkeys
        });
    }





    constructor(playerId, event) {
        this.#id_ = playerId;
        this.id_ = playerId;

        this.level_ = event.level || Player.LEVEL_PLAYER;
        this.levelIsTemporary_ = false;
        this.vip_ = false;
        this.undercover_ = false;
        this.gangId_ = null;

        this.syncedData_ = new MockPlayerSyncedData(this.id_);

        this.userId_ = null;


        this.gangColor_ = null;
        this.removedObjectCount_ = 0;
        this.messageLevel_ = 0;

        this.streamerObjectsUpdated_ = false;

        this.playerSettings_ = new PlayerSettings();

        this.initialize(event);
    }



    get level() { return this.level_; }
    set level(value) { this.level_ = value; }

    get levelIsTemporary() { return this.levelIsTemporary_; }
    set levelIsTemporary(value) { this.levelIsTemporary_ = value; }

    get syncedData() { return this.syncedData_; }

    isAdministrator() {
        return this.level_ == Player.LEVEL_ADMINISTRATOR ||
               this.level_ == Player.LEVEL_MANAGEMENT;
    }

    isTemporaryAdministrator() {
        return this.isAdministrator() && this.levelIsTemporary_;
      }

    isManagement() { return this.level_ == Player.LEVEL_MANAGEMENT; }

    isUndercover() { return this.undercover_; }

    isRegistered() { return this.userId_ != null; }

    get userId() { return this.userId_; }

    // Returns whether this player is a VIP member of Las Venturas Playground.
    isVip() { return this.vip_; }

    // Sets whether the player is a VIP member. Only exposed for testing purposes.
    setVip(value) { this.vip_ = value; }

    // Gets or sets the Id of the gang this player is part of.
    get gangId() { return this.gangId_; }
    set gangId(value) { this.gangId_ = value; }

    

    // Gets the most recent shot vectors for the player.
    getLastShotVectors() {
        return {
            source: new Vector(0, 0, 0),
            target: new Vector(0, 0, 0),
        };
    }

    // Serializes the player's current state into a buffer.
    serializeState() {}

    // Restores the player's previous state from a buffer.
    restoreState() {}

    // Removes default game objects from the map of model |modelId| that are within |radius| units
    // of the |position|. Should be called while the player is connecting to the server.
    removeGameObject(modelId, position, radius) {
        this.removedObjectCount_++;
    }

    // Gets the number of objects that have been removed from the map for this player.
    get removedObjectCount() { return this.removedObjectCount_; }

    // Gets or sets the message level at which this player would like to receive messages.
    get messageLevel() { return this.messageLevel_; }
    set messageLevel(value) { this.messageLevel_ = value; }

    // Gets or sets the gang color of this player. May be NULL when no color has been defined.
    get gangColor() { return this.gangColor_; }
    set gangColor(value) { this.gangColor_ = value; }

    

    

    updateStreamerObjects() { this.streamerObjectsUpdated_ = true; }

    streamerObjectsUpdated() { return this.streamerObjectsUpdated_; }

    get settings() { return this.playerSettings_; }
}

export default MockPlayer;
