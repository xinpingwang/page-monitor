"use strict";

const Monitor = require("./main/monitor.js");
const options = require("./options");

const monitor = new Monitor("https://www.baidu.com", options);
monitor.capture();
