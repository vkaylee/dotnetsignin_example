#!/bin/bash
podman-compose --profile cli run --rm dotnet "$@"
