// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MinigameDriver = require('features/minigames/minigame_driver.js');
const MockServer = require('test/mock_server.js');

describe('PlaygroundCommands', (it, beforeEach, afterEach) => {
    let player = null;

    MockServer.bindTo(beforeEach, afterEach,
        () =>  player = server.playerManager.getById(0 /* Gunther */));

});