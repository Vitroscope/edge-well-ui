"use strict";

const path = require("path");
const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");

const mqtt = require('azure-iot-device-mqtt').Mqtt;
const ModuleClient = require('azure-iot-device').ModuleClient;
const Message = require('azure-iot-device').Message;
let mainWindow,
    ipcLive = false,
    moduleClient,
    latestSerialData = {
        value: 384
    };


ModuleClient.fromEnvironment(mqtt, function (err, client) {
    if (err) {
        throw err;
    } else {
        client.on('error', function (err) {
            throw err;
        });
        client.open(function (err) {
            if (err) {
                throw err;
            } else {
                console.log('IoT Hub module client initialized');
                moduleClient = client;
                moduleClient.on('inputMessage', function (inputName, msg) {
                    filterMessage(client, inputName, msg);
                });

            }
        });
    }
});

function filterMessage(client, inputName, message) {
    client.complete(message, printResultFor('Receiving message'));
    if (inputName === 'serialDataInput') {
        const messageBytes = message.getBytes().toString('utf8');
        const messageObject = JSON.parse(messageBytes);
        latestSerialData = messageObject;
    }
}


function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: process.env.CDH_SCREEN_WIDTH,
        height: process.env.CDH_SCREEN_HEIGHT,
        fullscreen: true,
        alwaysOnTop: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile("app/index.html");

    globalShortcut.register("Esc", () => {
        if (mainWindow.isFullScreen()) {
            mainWindow.setFullScreen(false);
        }
    });

    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on("closed", function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

app.allowRendererProcessReuse = true;

app.on("gpu-info-update", () => {
    console.log(app.getGPUFeatureStatus());
    app.getGPUInfo('complete').then((results) => {
        console.log(results);
    });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on("heartbeat", (event, args) => {
    console.log("heartbeat", args);
    event.reply("heartbeat", "pong");
});

ipcMain.on("get-latest-serial-data", (event) => {
    event.sender.send('latest-serial-data', latestSerialData);
});
