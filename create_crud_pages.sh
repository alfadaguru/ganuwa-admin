#!/bin/bash

# This script creates all CRUD page files for the remaining content types
BASE_DIR="src/pages/content"

# Create index files for all content types
for dir in HeroBanners Announcements PressReleases Events Leaders Services Projects MDAs LGAs Media QuickLinks Pages FAQs Contacts Subscribers Users; do
  echo "export { default } from './${dir}List';" > "$BASE_DIR/$dir/index.tsx"
done

echo "Created all index files"
