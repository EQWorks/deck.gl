#!/bin/bash
find . -name dist.tgz | xargs rm -f
find . -name dist | xargs -I '{}' tar -C {}/es6 -czvf {}/../dist.tgz .
