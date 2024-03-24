/**
 * Stores available TCP/UDP ports in local array.
 * Assign ports to channels upon request and retrieve them when stream ends.
 */

import NoAvailablePort = require("../../exceptions/NoAvailablePort");
import UnassignedPort = require("../../exceptions/UnassignedPort");

let ports: number[] = [...Array(40).keys()].map(i => i + 3005);


function portsLeft() {
  return ports.length;
}


function acquirePort() {
  if (portsLeft())
    return ports.pop();
  else
    throw new NoAvailablePort();
}


function releasePort(port) {
  if (port)
    ports.push(port);
}

function getPorts() {
  return [...ports];
}


export = {
  portsLeft: portsLeft,
  acquirePort: acquirePort,
  releasePort: releasePort,
  getPorts: getPorts,
};