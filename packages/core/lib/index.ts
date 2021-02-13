"use strict";

import { Monitor } from "./main/monitor";
import { options } from "./options";

const monitor = new Monitor(options);

monitor.capture("https://www.baidu.com");

monitor.capture("https://kaifa.baidu.com", true);
