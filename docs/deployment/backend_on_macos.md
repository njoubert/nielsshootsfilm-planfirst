# Backend on MacOS Deployment Plan

## Overview

Deploy the Go admin backend as a go binary running right on MacOS.
Build it into the ~/webserver/sites/nielsshootsfilm.com/dynamic/ folder
With a env file in the same folder for configuration.
Launch it using Launchdaemons.

## Architecture

```text

data directory -> /Users/njoubert/webserver/sites/nielsshootsfilm.com/public/data/
uploads directory -> /Users/njoubert/webserver/sites/nielsshootsfilm.com/public/uploads/

executable directory -> /Users/njoubert/webserver/sites/nielsshootsfilm.com/dynamic/admin
env file -> /Users/njoubert/webserver/sites/nielsshootsfilm.com/dynamic/env

Go executable "admin" exposes port 6180 to localhost

nginx reverse-proxies /api to port 6180:/api

```
