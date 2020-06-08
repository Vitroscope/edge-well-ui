"use strict";

const path = require("path");
const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");

const Transport = require("azure-iot-device-mqtt").Mqtt;
const Client = require("azure-iot-device").ModuleClient;
const Message = require("azure-iot-device").Message;
let mainWindow,
    ipcLive = false,
    edgeLive = false,
    edgeClient;

// This function just pipes the messages without any change.
function pipeMessage(client, msg) {
    client.complete(msg, printResultFor("Receiving message"));

    var message = msg.getBytes().toString("utf8");
    if (message) {
        var outputMsg = new Message(message);
        client.sendOutputEvent(
            "output1",
            outputMsg,
            printResultFor("Sending received message")
        );
    }
}

// Helper function to print results in the console
function printResultFor(op) {
    return function printResult(error, result) {
        if (error) {
            console.log(op + " error: " + error.toString());
        }
        if (result) {
            console.log(op + " status: " + result.constructor.name);
        }
  };
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
  
    edgeClient = Client.fromEnvironment(Transport);

    edgeClient.on("error", function(error) {
        edgeLive = false;
        throw error;
    });

    // connect to the Edge instance
    edgeClient.open(function(error) {
        if (error) {
            throw error;
        } else {
            console.log("IoT Hub module client initialized");
            edgeLive = true;
            // Act on input messages to the module.
            client.on("connection-test", function() {
                pipeMessage(client,'connection-test');
            });
        }
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
    ipcLive = true;
    console.log("heartbeat", args);
    event.sender.send("heartbeat", "pong");
});

ipcMain.on("option", (event, args) => {
    if(edgeLive && edgeClient !== undefined) {
        const message = {
            text: 'Testing connection from Well-O-Meter'
        };
        const outputMessage = new Message(JSON.stringify(message))
        edgeClient.sendEvent(
            outputMessage,
            printResultFor("Sending received message")
        );
    }
});
