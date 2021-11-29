#!/bin/bash
find . -name dist.tgz | xargs rm -f
find . -name dist | xargs -I '{}' tar --exclude='dist.tgz' --exclude='bundle.js' --exclude='node_modules' -C {}/.. -czvf {}/../dist.tgz .
