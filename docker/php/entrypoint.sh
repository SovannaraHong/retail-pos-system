#!/bin/bash
set -e

# Clear any duplicate MPM configurations
rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf

# Ensure prefork MPM is enabled
a2enmod mpm_prefork rewrite

# Execute the command passed to the container
exec "$@"
