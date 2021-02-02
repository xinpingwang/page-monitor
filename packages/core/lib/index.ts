"use strict";

import { Monitor } from "./main/monitor";
import { options } from "./options";

const monitor = new Monitor("https://www.baidu.com", options);
monitor.capture();
